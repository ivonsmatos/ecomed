import time
from collections import OrderedDict


class TTLSessionStore:
    def __init__(self, ttl_seconds: int, max_sessions: int):
        self.ttl_seconds = max(60, ttl_seconds)
        self.max_sessions = max(1, max_sessions)
        self._sessions: OrderedDict[str, tuple[list[dict], float]] = OrderedDict()

    def _purge(self) -> None:
        cutoff = time.monotonic() - self.ttl_seconds
        for session_id in [
            key for key, (_, accessed_at) in self._sessions.items() if accessed_at < cutoff
        ]:
            self._sessions.pop(session_id, None)

    def get(self, session_id: str) -> list[dict]:
        self._purge()
        entry = self._sessions.pop(session_id, None)
        if not entry:
            return []
        messages, _ = entry
        self._sessions[session_id] = (messages, time.monotonic())
        return list(messages)

    def save_turn(self, session_id: str, question: str, answer: str) -> None:
        self._purge()
        entry = self._sessions.pop(session_id, None)
        messages = entry[0] if entry else []
        messages.extend(
            [
                {"role": "user", "content": question},
                {"role": "assistant", "content": answer},
            ]
        )
        self._sessions[session_id] = (messages[-16:], time.monotonic())
        while len(self._sessions) > self.max_sessions:
            self._sessions.popitem(last=False)

    def clear(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)

    def __len__(self) -> int:
        self._purge()
        return len(self._sessions)
