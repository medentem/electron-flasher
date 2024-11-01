import type { SetOptions } from "@serialport/bindings-interface";
import {
  ByteLengthParser,
  SerialPort as ElectronSerialPort,
  SerialPort,
} from "serialport";

interface SerialOptions {
  baudRate: number;
  dataBits?: number | undefined;
  stopBits?: number | undefined;
  parity?: ParityType | undefined;
  bufferSize?: number | undefined;
  flowControl?: FlowControlType | undefined;
}

interface SerialPortInfo {
  usbVendorId?: number | undefined;
  usbProductId?: number | undefined;
  /** If the port is a service on a Bluetooth device this member will be a BluetoothServiceUUID
   * containing the service class UUID. Otherwise it will be undefined. */
  bluetoothServiceClassId?: number | string | undefined;
}

interface SerialOutputSignals {
  dataTerminalReady?: boolean | undefined;
  requestToSend?: boolean | undefined;
  break?: boolean | undefined;
}

type ParityType = "none" | "even" | "odd";
type FlowControlType = "none" | "hardware";

export class ElectronSerialPortWrapper {
  protected _electronSerialPort: ElectronSerialPort;
  protected _serialPortInfo: SerialPortInfo;
  protected _logging: boolean;

  /** A flag indicating the logical connection state of serial port */
  readonly connected: boolean;
  private readableStream: ReadableStream<Uint8Array>;
  private writableStream: WritableStream<Uint8Array>;

  constructor(
    path: string,
    baud: number,
    info: SerialPortInfo,
    logging: boolean,
  ) {
    this._electronSerialPort = new SerialPort({
      path,
      baudRate: baud,
      autoOpen: false,
    });

    this._serialPortInfo = info;
    this._logging = logging;
  }

  get readable() {
    if (!this.readableStream) {
      this.readableStream = this.createReadableStream();
    }
    return this.readableStream;
  }

  get writable() {
    if (!this.writableStream) {
      this.writableStream = this.createWritableStream();
    }
    return this.writableStream;
  }

  public async setSignals(signals: SerialOutputSignals): Promise<void> {
    this.info(`Attempting to set signals: ${JSON.stringify(signals)}`);
    const obj: SetOptions = {};
    if (signals.dataTerminalReady !== undefined) {
      obj.dtr = signals.dataTerminalReady;
    }
    if (signals.requestToSend !== undefined) {
      obj.rts = signals.requestToSend;
    }
    if (signals.break !== undefined) {
      obj.brk = signals.break;
    }
    return new Promise((resolve, reject) => {
      this._electronSerialPort.set(obj, async (err) => {
        if (err) {
          reject(new Error(`Failed to set control signals: ${err.message}`));
        } else {
          this.info("Successfully set signals.");
          // Introduce a delay if necessary
          await new Promise((r) => setTimeout(r, 100));
          resolve();
        }
      });
    });
  }

  public getInfo(): SerialPortInfo {
    return this._serialPortInfo;
  }

  public async open(options?: SerialOptions): Promise<void> {
    if (this._electronSerialPort.isOpen) await this.close();
    this._electronSerialPort = new ElectronSerialPort({
      path: this._electronSerialPort.path,
      baudRate: options.baudRate,
      dataBits: options.dataBits as undefined | 5 | 6 | 7 | 8,
      stopBits: options.stopBits as undefined | 1 | 1.5 | 2,
      parity: options.parity,
      rtscts:
        options.flowControl !== undefined && options.flowControl !== "none",
      autoOpen: false,
    });
    this._electronSerialPort.on("open", () => {
      this.log("PORT OPEN");
      this.log(this._electronSerialPort);
    });
    return new Promise((resolve, reject) => {
      this._electronSerialPort.open((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  public async close(): Promise<void> {
    this.info("Request received to close port.");
    return new Promise((resolve, reject) => {
      this._electronSerialPort.close((err) => {
        if (err) reject(err);
        else {
          this.info("Port closed.");
          resolve();
        }
      });
    });
  }

  private createReadableStream(): ReadableStream<Uint8Array> {
    const port = this._electronSerialPort;
    let onData: (data: Buffer) => void;
    let onError: (err: Error) => void;
    let onClose: () => void;
    let isClosed = false;
    let inPacket = false;
    let currentPacket: number[] = [];
    const adapter = this;

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        onData = (data: Buffer) => {
          if (isClosed) return;

          this.info(`Received data from device: ${Array.from(data)}`);

          for (let idx = 0; idx < data.length; idx++) {
            const byte = data[idx];
            if (byte === 0xc0) {
              if (!inPacket) {
                // Start of packet detected
                inPacket = true;
                currentPacket = [byte];
              } else {
                // End of packet detected
                inPacket = false;
                // Enqueue the collected packet data
                currentPacket.push(byte);
                const packetArray = new Uint8Array(currentPacket);
                this.info(`Found SLIP Packet: ${packetArray}`);
                controller.enqueue(packetArray);
                currentPacket = [];
              }
            } else if (inPacket) {
              // Inside a packet, collect data
              currentPacket.push(byte);
            }
          }
        };

        onError = (err: Error) => {
          if (isClosed) return;
          console.error("ReadableStream error:", err);
          controller.error(err);
        };

        onClose = () => {
          if (isClosed) return;
          console.log("Closing stream.");
          if (!port.isOpen) {
            controller.close();
            isClosed = true;
          }
          adapter.readableStream = undefined;
        };

        port.on("data", onData);
        port.on("error", onError);
        port.on("close", onClose);
      },
      cancel(reason) {
        if (isClosed) return;
        console.log("Cancel stream.");
        isClosed = true;
        port.off("data", onData);
        port.off("error", onError);
        port.off("close", onClose);
        adapter.readableStream = undefined;
      },
    });
  }

  private createWritableStream(): WritableStream<Uint8Array> {
    const port = this._electronSerialPort;
    let isClosed = false;
    const adapter = this;

    return new WritableStream<Uint8Array>({
      async write(chunk) {
        if (isClosed) {
          throw new Error("Cannot write to a closed stream.");
        }

        adapter.log(`Attempting to write to device: ${Array.from(chunk)}`);

        return new Promise<void>((resolve, reject) => {
          port.write(
            Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength),
            (err) => {
              if (err) {
                adapter.error(`Error writing to port: ${err}`);
                reject(
                  new Error(`Failed to write to serial port: ${err.message}`),
                );
              } else {
                port.drain((drainErr) => {
                  if (drainErr) {
                    adapter.error(`Error draining port: ${drainErr}`);
                    reject(
                      new Error(
                        `Failed to drain serial port: ${drainErr.message}`,
                      ),
                    );
                  } else {
                    adapter.log(`Write successful: ${Array.from(chunk)}`);
                    resolve();
                  }
                });
              }
            },
          );
        });
      },
      async close() {
        if (isClosed) return;
        isClosed = true;

        return new Promise<void>((resolve, reject) => {
          port.close((err) => {
            if (err) {
              adapter.error(`Error closing port: ${err}`);
              reject(new Error(`Failed to close serial port: ${err.message}`));
            } else {
              adapter.log("Serial port closed.");
              resolve();
            }
          });
          adapter.writableStream = undefined;
        });
      },
      abort(reason) {
        adapter.error(`WritableStream aborted: ${reason}`);
        return this.close();
      },
    });
  }

  private log(msg: any) {
    if (this._logging) {
      console.log(msg);
    }
  }

  private error(msg: any) {
    if (this._logging) {
      console.error(msg);
    }
  }

  private info(msg: any) {
    if (this._logging) {
      console.info(msg);
    }
  }
}
