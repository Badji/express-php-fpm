import net, { NetConnectOpts, Socket } from "net"
import * as FCGI from "./fcgi"

export class Client {
  buffer = Buffer.alloc(0)
  reqId = 0
  socket: Socket

  constructor(socketOptions: NetConnectOpts) {
    this.socket = net.connect(socketOptions)
    this.socket.on("data", this.onData.bind(this))
    if (this.onClose) {
      this.socket.on("close", this.onClose.bind(this))
    }
    if (this.onError) {
      this.socket.on("error", this.onError.bind(this))
    }
  }

  send(msgType: number, content: Buffer) {
    for (let offset = 0; offset < content.length || offset === 0; offset += 0xffff) {
      const chunk = content.slice(offset, offset + 0xffff)
      const header = FCGI.Header(FCGI.VERSION_1, msgType, this.reqId, chunk.length, 0)
      this.socket.write(header)
      this.socket.write(chunk)
    }
  }

  onData(data) {
    this.buffer = Buffer.concat([this.buffer, data])

    while (this.buffer.length) {
      const record = FCGI.ParseHeader(this.buffer)
      if (!record) {
        break
      }

      this.buffer = this.buffer.slice(record.recordLength)
      this.got(record)
    }
  }

  got(record) {
    // to be implemented in parent class
  }
}
