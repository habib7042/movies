const CORRECT_PIN = "7042";
const MAX_HISTORY = 50;

export class ChatRoom {
  constructor(state) {
    this.state = state;
    this.sockets = new Map();
    this.history = [];
  }

  async fetch(request) {
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();

    if (this.history.length > 0) {
      server.send(JSON.stringify({ type: "history", messages: this.history }));
    }

    this.sockets.set(server, { user: null, authed: false });
    server.addEventListener("message", (e) => this.#onMessage(server, e));
    server.addEventListener("close", () => this.sockets.delete(server));
    server.addEventListener("error", () => this.sockets.delete(server));

    return new Response(null, { status: 101, webSocket: client });
  }

  #onMessage(socket, event) {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }

    const session = this.sockets.get(socket);

    if (data.type === "auth") {
      if (data.pin === CORRECT_PIN && data.user?.trim().length > 0) {
        session.authed = true;
        session.user = data.user.trim().substring(0, 20);
        socket.send(JSON.stringify({ type: "auth_ok", user: session.user }));
      } else {
        socket.send(JSON.stringify({ type: "auth_fail" }));
        socket.close(1008, "Invalid PIN");
      }
      return;
    }

    if (!session.authed) { socket.close(1008, "Not authenticated"); return; }

    if (data.type === "chat_msg") {
      if (!data.text && !data.image) return;
      if (data.image && data.image.length > 700000) {
        socket.send(JSON.stringify({ type: "error", msg: "Image too large (max 512KB)" }));
        return;
      }
      const msg = {
        type: "chat_msg",
        id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        user: session.user,
        text: data.text ? data.text.substring(0, 1000) : null,
        image: data.image || null,
        replyTo: data.replyTo || null,
        replyToText: data.replyToText ? data.replyToText.substring(0, 100) : null,
      };
      this.history.push(msg);
      if (this.history.length > MAX_HISTORY) this.history.shift();
      this.#broadcast(JSON.stringify(msg));

    } else if (data.type === "typing") {
      const payload = JSON.stringify({ type: "typing", user: session.user, isTyping: !!data.isTyping });
      for (const [s] of this.sockets) {
        if (s !== socket && s.readyState === 1) try { s.send(payload); } catch {}
      }
    }
  }

  #broadcast(msg) {
    for (const [socket] of this.sockets) {
      try {
        socket.readyState === 1 ? socket.send(msg) : this.sockets.delete(socket);
      } catch { this.sockets.delete(socket); }
    }
  }
}