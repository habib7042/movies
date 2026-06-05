export async function onRequest(context) {
  const { request, env } = context;

  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected WebSocket upgrade.", { status: 426 });
  }

  const id = env.CHAT_ROOM.idFromName("main-room");
  const room = env.CHAT_ROOM.get(id);
  return room.fetch(request);
}