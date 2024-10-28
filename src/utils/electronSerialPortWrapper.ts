import { SetOptions } from "@serialport/bindings-interface";
import {
  ByteLengthParser,
  SerialPort,
  type SerialPort as ElectronSerialPort,
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
  private buffer: Uint8Array = new Uint8Array(0);

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
    this._electronSerialPort.on("open", () => {
      this.log("PORT OPEN");
      this.log(this._electronSerialPort);
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
    let obj: SetOptions;
    if (
      signals.dataTerminalReady !== undefined &&
      signals.requestToSend !== undefined
    ) {
      obj = {
        dtr: signals.dataTerminalReady,
        rts: signals.requestToSend,
      };
    } else if (signals.dataTerminalReady !== undefined) {
      obj = {
        dtr: signals.dataTerminalReady,
      };
    } else if (signals.requestToSend !== undefined) {
      obj = {
        rts: signals.requestToSend,
      };
    }
    return new Promise((resolve, reject) => {
      this._electronSerialPort.set(obj, (err) => {
        if (err) {
          reject(new Error(`Failed to set control signals: ${err.message}`));
        } else {
          this.info("Successfully set signals.");
          resolve();
        }
      });
    });
  }

  public getInfo(): SerialPortInfo {
    return this._serialPortInfo;
  }

  public async open(options?: SerialOptions): Promise<void> {
    if (options && options.baudRate !== this._electronSerialPort.baudRate) {
      this.info(
        `Baud Rate Change - Old: ${this._electronSerialPort.baudRate} New: ${options.baudRate}`,
      );
      if (this._electronSerialPort.isOpen) await this.close();
      await this.updateBaud(options.baudRate);
    }
    if (this._electronSerialPort.isOpen) return;
    return new Promise((resolve, reject) => {
      this._electronSerialPort.open((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async updateBaud(baudRate: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this._electronSerialPort.update({ baudRate }, (err) => {
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

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        onData = (data: Buffer) => {
          if (isClosed) return;

          // Append new data to the buffer
          this.buffer = new Uint8Array([...this.buffer, ...data]);

          let startIdx: number;
          let endIdx: number;

          // Process buffer to find SLIP packets between `0xC0` markers
          while (
            (startIdx = this.buffer.indexOf(0xc0)) !== -1 &&
            (endIdx = this.buffer.indexOf(0xc0, startIdx + 1)) !== -1
          ) {
            // Extract packet data between two `0xC0` markers
            const packet = this.buffer.slice(startIdx + 1, endIdx);
            controller.enqueue(packet); // Send only valid SLIP packet to controller

            // Remove processed packet from the buffer
            this.buffer = this.buffer.slice(endIdx + 1);
          }
        };

        onError = (err: Error) => {
          if (isClosed) return;
          console.error("ReadableStream error:", err);
          controller.error(err);
        };

        onClose = () => {
          if (isClosed) return;
          if (!port.isOpen) {
            controller.close();
            isClosed = true;
          }
        };

        port.on("data", onData);
        port.on("error", onError);
        port.on("close", onClose);
      },
      cancel(reason) {
        if (isClosed) return;
        isClosed = true;
        port.off("data", onData);
        port.off("error", onError);
        port.off("close", onClose);
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

        adapter.log(`Attempting write: ${chunk}`);

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
                    adapter.log(`Write successful: ${chunk}`);
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
