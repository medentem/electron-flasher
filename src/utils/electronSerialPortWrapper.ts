import type { SerialPort as ElectronSerialPort } from "serialport";

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

  /** A flag indicating the logical connection state of serial port */
  readonly connected: boolean;
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;

  constructor(electronSerialPort: ElectronSerialPort) {
    this._electronSerialPort = electronSerialPort;
    this._serialPortInfo = {};
    this.readable = this.createReadableStream();
    this.writable = this.createWritableStream();
  }

  public async setSignals(signals: SerialOutputSignals): Promise<void> {
    this._electronSerialPort.set({ rts: signals.requestToSend });
  }

  public getInfo(): SerialPortInfo {
    return this._serialPortInfo;
  }

  private createReadableStream(): ReadableStream<Uint8Array> {
    const port = this._electronSerialPort;
    return new ReadableStream({
      start(controller) {
        port.on("data", (data: Buffer) => {
          controller.enqueue(new Uint8Array(data));
        });
        port.on("error", (err) => {
          controller.error(err);
        });
        port.on("close", () => {
          controller.close();
        });
      },
      cancel() {
        port.close();
      },
    });
  }

  private createWritableStream(): WritableStream<Uint8Array> {
    const port = this._electronSerialPort;
    return new WritableStream({
      write(chunk) {
        return new Promise((resolve, reject) => {
          port.write(Buffer.from(chunk), (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      },
      close() {
        port.close();
      },
      abort() {
        port.close();
      },
    });
  }
}
