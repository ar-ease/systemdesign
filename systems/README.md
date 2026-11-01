# Boss systems

Timed 45-minute designs. Copy `templates/system-design.md` to `systems/<name>.md`, set a timer, and draw it in Excalidraw. Then get graded by Claude acting as a mock interviewer.

| System | The one hard problem | Unlocks after level |
| --- | --- | --- |
| URL shortener | Unique short IDs at scale; read-heavy redirects | 08 |
| Rate limiter | Distributed counting under bursts | 04 + 06 |
| Instagram feed | Celebrity fan-out (push vs pull) | 08 + 05 |
| WhatsApp | Delivery and ordering to offline users | 05 + 12 |
| BookMyShow | Never sell a seat twice | 07 + 13 |
| Razorpay payments | Money moves exactly once | 13 |
| Swiggy dispatch | Nearest available partner from live locations | 14 |
| YouTube | Upload → transcode pipeline; video delivery via CDN | 09 + 06 |
| Google Docs | Concurrent edits (OT / CRDT) | 12 |
