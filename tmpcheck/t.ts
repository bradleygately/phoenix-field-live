import { SCHEDULE } from "../src/data/schedule";
import { parseRange } from "../src/data/schedule";
for (const r of ["8:00-9:00 AM","11:45 AM-12:30 PM","12:30-1:15 PM","10:30 AM-12:00 PM","9:00 PM-open","Midnight-open","11:30 PM-Midnight","12:15-1:45 PM","4:55-5:05 PM"]) console.log(r, JSON.stringify(parseRange(r)));
console.log("count", SCHEDULE.length);
for (const d of ["2026-07-31","2026-08-01","2026-08-02"]) console.log(d, SCHEDULE.filter(i=>i.date===d).length);
for (const i of SCHEDULE) if (!i.title || i.endMin<=i.startMin) console.log("BAD", i.id, i.title, i.startMin, i.endMin);
console.log(JSON.stringify(SCHEDULE.filter(i=>i.date==="2026-08-02").slice(0,3),null,1));
console.log("committed friday:", SCHEDULE.filter(i=>i.date==="2026-07-31"&&i.commit.jesse).length);
