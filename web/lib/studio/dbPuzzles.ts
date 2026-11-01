import { buildSchema, type DbAnti, type DbGoal, type Schema, type SchemaView, type Table } from "./schema";

export type DbStep = {
  title: string;
  story: string;
  goals: DbGoal[];
  antis?: DbAnti[];
  hints: string[];
  explain: string;
  solution: Schema;
};
export type DbPuzzle = { id: string; title: string; blurb: string; level: string; difficulty: "Starter" | "Core" | "Interview"; steps: DbStep[] };

// ---------- goal builders (friendly messages, flexible names) ----------
type Find = (v: SchemaView) => Table | undefined;
const T = (re: RegExp): Find => (v) => v.table(re);

const tableGoal = (text: string, find: Find, name: string): DbGoal => ({
  text, check: (v) => (find(v) ? true : `Click “+ Table” and name it ${name}.`),
});
const colGoal = (text: string, find: Find, tname: string, re: RegExp, cname: string, types?: string[]): DbGoal => ({
  text,
  check: (v) => {
    const t = find(v);
    if (!t) return `Create the ${tname} table first.`;
    const c = v.col(t, re);
    if (!c) return `Add a column ${cname} to ${t.name}.`;
    if (types && !types.includes(c.type)) return `${t.name}.${c.name} is ${c.type}. Use ${types.join(" or ")}.`;
    return true;
  },
});
const fkGoal = (text: string, find: Find, tname: string, re: RegExp, cname: string, to: Find, toName: string): DbGoal => ({
  text,
  check: (v) => {
    const t = find(v), target = to(v);
    if (!t) return `Create the ${tname} table first.`;
    if (!target) return `Create the ${toName} table first.`;
    const c = v.col(t, re);
    if (!c) return `Add ${cname} (bigint) to ${t.name}.`;
    if (!v.refs(c, target)) return `${t.name}.${c.name} should reference ${target.name}. In its row, set “references” to ${target.name}.id. That makes it a foreign key.`;
    return true;
  },
});
const uniqueGoal = (text: string, find: Find, tname: string, cols: [RegExp, string][], why: string): DbGoal => ({
  text,
  check: (v) => {
    const t = find(v);
    if (!t) return `Create the ${tname} table first.`;
    const cs = cols.map(([re]) => v.col(t, re));
    const missing = cols.find((_, i) => !cs[i]);
    if (missing) return `Add the ${missing[1]} column to ${t.name}.`;
    if (v.uniqueOn(t, cs)) return true;
    return cols.length > 1
      ? `${why} Make (${cs.map((c) => c!.name).join(", ")}) unique: mark both as PK (composite key), or add a UNIQUE index on both.`
      : `${why} Tick “unique” on ${t.name}.${cs[0]!.name}.`;
  },
});
const indexGoal = (text: string, find: Find, tname: string, cols: [RegExp, string][], why: string): DbGoal => ({
  text,
  check: (v) => {
    const t = find(v);
    if (!t) return `Create the ${tname} table first.`;
    const cs = cols.map(([re]) => v.col(t, re));
    const missing = cols.find((_, i) => !cs[i]);
    if (missing) return `Add the ${missing[1]} column to ${t.name}.`;
    return v.indexedBy(t, cs) ? true : `${why} Add an index on ${t.name} (${cs.map((c) => c!.name).join(", ")}), in that order.`;
  },
});
const pkGoal = (text: string, find: Find, tname: string): DbGoal => ({
  text, check: (v) => { const t = find(v); if (!t) return `Create the ${tname} table first.`; return t.columns.some((c) => c.pk) ? true : `Give ${t.name} a primary key: an id bigint column marked PK.`; },
});

const users = T(/^(users?|accounts?|customers?)$/);
const urls = T(/(urls?|links?)$/);
const courses = T(/^courses?$/);
const enroll = T(/enrol/);
const lessons = T(/^lessons?$/);
const progress = T(/(progress|completion)/);
const movies = T(/^(movies?|films?)$/);
const screens = T(/^(screens?|halls?|auditoriums?|theat(re|er)s?)$/);
const shows = T(/^(shows?|showtimes?|screenings?)$/);
const seats = T(/^seats?$/);
const bookings = T(/^(bookings?|orders?|reservations?)$/);
const seatBook = T(/(booking_seats?|booked_seats?|show_seats?|tickets?|seat_bookings?|reserved_seats?)$/);
const posts = T(/^posts?$/);
const follows = T(/^(follows?|followers?|followings?|relationships?)$/);
const likes = T(/^(likes?|post_likes?)$/);

const ID = /^id$/;
const CREATED = /^created(_at)?$/;

export const DB_PUZZLES: DbPuzzle[] = [
  {
    id: "url-shortener",
    title: "URL shortener tables",
    blurb: "Your first schema: primary keys, unique codes, and a foreign key.",
    level: "08",
    difficulty: "Starter",
    steps: [
      {
        title: "Store short links",
        story: "Each short link maps a code like 'abc123' to a long URL. Redirects look rows up by code, millions of times a day.",
        goals: [
          tableGoal("A table named urls", urls, "urls"),
          pkGoal("It has a primary key (id)", urls, "urls"),
          uniqueGoal("short_code is unique", urls, "urls", [[/(short_?code|code|slug|short|key)$/, "short_code (text)"]], "Two links with the same code means a redirect could go to the wrong place."),
          colGoal("long_url is stored as text", urls, "urls", /(long_?url|target|original|destination|url)$/, "long_url (text)", ["text", "varchar(255)"]),
          colGoal("created_at is a timestamp", urls, "urls", CREATED, "created_at (timestamptz)", ["timestamptz", "date"]),
        ],
        hints: [
          "Click “+ Table”, name it urls, and look at the id column it starts with.",
          "Add short_code (text) and tick unique. That also creates an index, so lookups by code are fast.",
          "Add long_url (text) and created_at (timestamptz).",
        ],
        explain: "UNIQUE on short_code does two jobs. It makes duplicate codes impossible, and it creates a B-tree index, so `WHERE short_code = 'abc123'` takes about 1 ms even with a billion rows.",
        solution: buildSchema([{ name: "urls", x: 0, y: 0, cols: "id bigint pk; short_code text unique; long_url text; created_at timestamptz" }]),
      },
      {
        title: "Links belong to users",
        story: "Signed-in users can see a 'My links' page listing every link they created, newest first.",
        goals: [
          tableGoal("A users table", users, "users"),
          uniqueGoal("Users log in by a unique email", users, "users", [[/email/, "email (text)"]], "Two accounts with the same email break login."),
          fkGoal("urls.user_id references users", urls, "urls", /^(user_id|owner_id|created_by)$/, "user_id", users, "users"),
          indexGoal("“My links” is fast: index on (user_id, created_at)", urls, "urls", [[/^(user_id|owner_id|created_by)$/, "user_id"], [CREATED, "created_at"]], "The 'My links' query is WHERE user_id = ? ORDER BY created_at DESC."),
        ],
        hints: [
          "Add a users table with id and email (unique).",
          "In urls, add user_id (bigint), and in that row choose references → users.id.",
          "Use “+ Index” on urls with user_id first, then created_at.",
        ],
        explain: "A composite index on (user_id, created_at) serves both the filter and the sort, so Postgres reads exactly the 20 rows it needs. The column order matters: (created_at, user_id) wouldn't help this query. This is the leftmost-prefix rule.",
        solution: buildSchema([
          { name: "users", x: 0, y: 0, cols: "id bigint pk; email text unique; created_at timestamptz" },
          { name: "urls", x: 340, y: 0, cols: "id bigint pk; short_code text unique; long_url text; user_id bigint null ->users.id; created_at timestamptz", idx: ["user_id,created_at"] },
        ]),
      },
    ],
  },
  {
    id: "udemy",
    title: "Udemy: courses & students",
    blurb: "One-to-many, many-to-many, and why lists in a column are a trap.",
    level: "07",
    difficulty: "Core",
    steps: [
      {
        title: "Instructors create courses",
        story: "Instructors (who are also users) create courses. Each course has a title and a price.",
        goals: [
          tableGoal("A users table", users, "users"),
          uniqueGoal("Email is unique", users, "users", [[/email/, "email (text)"]], "Two accounts with one email break login and password reset."),
          tableGoal("A courses table", courses, "courses"),
          fkGoal("courses.instructor_id references users", courses, "courses", /(instructor|teacher|author|owner|user)_id$/, "instructor_id", users, "users"),
          colGoal("Price is stored exactly", courses, "courses", /price/, "price (numeric(10,2))", ["numeric(10,2)", "int", "bigint"]),
        ],
        hints: [
          "Two tables: users and courses.",
          "One instructor has many courses, so the 'many' side (courses) gets the foreign key: instructor_id → users.id.",
          "Price is money, so use numeric(10,2), never float.",
        ],
        explain: "In a one-to-many relationship, the foreign key always goes on the 'many' side. courses.instructor_id points to users.id, and the database rejects a course whose instructor doesn't exist.",
        solution: buildSchema([
          { name: "users", x: 0, y: 0, cols: "id bigint pk; email text unique; name text; created_at timestamptz" },
          { name: "courses", x: 340, y: 0, cols: "id bigint pk; instructor_id bigint ->users.id; title text; price numeric(10,2); created_at timestamptz", idx: ["instructor_id"] },
        ]),
      },
      {
        title: "Students enroll in courses",
        story: "A student can take many courses, and a course has many students. You need to list a student's courses and a course's students.",
        goals: [
          tableGoal("A join table for enrollments", enroll, "enrollments"),
          fkGoal("enrollments.user_id references users", enroll, "enrollments", /^(user|student)_id$/, "user_id", users, "users"),
          fkGoal("enrollments.course_id references courses", enroll, "enrollments", /^course_id$/, "course_id", courses, "courses"),
          uniqueGoal("A student can't enroll twice", enroll, "enrollments", [[/^(user|student)_id$/, "user_id"], [/^course_id$/, "course_id"]], "Without this, a double-click creates two enrollments."),
          indexGoal("“Students of a course” is fast", enroll, "enrollments", [[/^course_id$/, "course_id"]], "Your unique key starts with user_id, so it can't serve WHERE course_id = ?."),
        ],
        antis: [{
          id: "enroll-in-courses", severity: "error", title: "Enrollment stored on courses or users",
          why: "A column like courses.student_id can hold only one student, and a list of IDs can't be joined or indexed. Many-to-many relationships always need their own join table.",
          when: (v) => [courses(v), users(v)].flatMap((t) => (t ? t.columns.filter((c) => /^(student|course)_id$/.test(c.name.toLowerCase())).map((c) => `${t.name}.${c.name}`) : [])),
        }],
        hints: [
          "Many-to-many always needs a third table, often called a join table.",
          "enrollments: user_id → users, course_id → courses, enrolled_at timestamptz.",
          "Mark user_id and course_id both as PK (a composite key). Then add an index on course_id for the reverse lookup.",
        ],
        explain: "A join table has one row per (student, course) pair. The composite key (user_id, course_id) prevents duplicates and makes 'my courses' fast. A second index on course_id makes 'students in this course' fast, because an index only helps queries that use its leading column.",
        solution: buildSchema([
          { name: "users", x: 0, y: 0, cols: "id bigint pk; email text unique; name text; created_at timestamptz" },
          { name: "courses", x: 680, y: 0, cols: "id bigint pk; instructor_id bigint ->users.id; title text; price numeric(10,2); created_at timestamptz", idx: ["instructor_id"] },
          { name: "enrollments", x: 340, y: 230, cols: "user_id bigint pk ->users.id; course_id bigint pk ->courses.id; enrolled_at timestamptz", idx: ["course_id"] },
        ]),
      },
      {
        title: "Lessons and progress",
        story: "Courses contain ordered lessons. The app shows a tick next to each lesson a student has completed.",
        goals: [
          fkGoal("lessons.course_id references courses", lessons, "lessons", /^course_id$/, "course_id", courses, "courses"),
          uniqueGoal("Lesson order is unique within a course", lessons, "lessons", [[/^course_id$/, "course_id"], [/(position|order|seq|number|idx)/, "position (int)"]], "Two lessons can't both be lesson 3."),
          tableGoal("A table for lesson progress", progress, "lesson_progress"),
          uniqueGoal("A lesson is completed once per student", progress, "lesson_progress", [[/^(user|student)_id$/, "user_id"], [/^lesson_id$/, "lesson_id"]], "A row per completion: completing twice shouldn't create two rows."),
        ],
        hints: [
          "lessons: id, course_id → courses, title, position int.",
          "Add a UNIQUE index on (course_id, position). It also serves 'lessons of this course, in order'.",
          "lesson_progress: user_id → users, lesson_id → lessons, completed_at, with (user_id, lesson_id) as the composite PK.",
        ],
        explain: "UNIQUE(course_id, position) is both a rule and an index: `WHERE course_id = ? ORDER BY position` reads the lessons already in order. lesson_progress is another join table, and the absence of a row means 'not done', so you never store a separate row per lesson marked false.",
        solution: buildSchema([
          { name: "users", x: 0, y: 0, cols: "id bigint pk; email text unique; name text" },
          { name: "courses", x: 680, y: 0, cols: "id bigint pk; instructor_id bigint ->users.id; title text; price numeric(10,2)", idx: ["instructor_id"] },
          { name: "enrollments", x: 340, y: 200, cols: "user_id bigint pk ->users.id; course_id bigint pk ->courses.id; enrolled_at timestamptz", idx: ["course_id"] },
          { name: "lessons", x: 1020, y: 200, cols: "id bigint pk; course_id bigint ->courses.id; position int; title text", idx: ["!course_id,position"] },
          { name: "lesson_progress", x: 680, y: 400, cols: "user_id bigint pk ->users.id; lesson_id bigint pk ->lessons.id; completed_at timestamptz", idx: ["lesson_id"] },
        ]),
      },
    ],
  },
  {
    id: "bookmyshow",
    title: "BookMyShow: seats that can't double-sell",
    blurb: "Model shows and seats so the database itself refuses a double booking.",
    level: "13",
    difficulty: "Interview",
    steps: [
      {
        title: "Movies, screens and shows",
        story: "A show is one movie playing on one screen at a given time. Users browse the upcoming shows for a movie.",
        goals: [
          tableGoal("A movies table", movies, "movies"),
          tableGoal("A screens table", screens, "screens"),
          fkGoal("shows.movie_id references movies", shows, "shows", /^(movie|film)_id$/, "movie_id", movies, "movies"),
          fkGoal("shows.screen_id references screens", shows, "shows", /^(screen|hall|theat(re|er))_id$/, "screen_id", screens, "screens"),
          indexGoal("“Upcoming shows for a movie” is fast", shows, "shows", [[/^(movie|film)_id$/, "movie_id"], [/(starts?_at|start_time|show_time|time)/, "starts_at"]], "The query is WHERE movie_id = ? AND starts_at > now() ORDER BY starts_at."),
        ],
        hints: ["Three tables: movies, screens, shows.", "shows has movie_id → movies, screen_id → screens and starts_at (timestamptz).", "Index shows on (movie_id, starts_at)."],
        explain: "shows connects a movie and a screen at a time. The (movie_id, starts_at) index covers the browse page completely, and Postgres doesn't need to sort.",
        solution: buildSchema([
          { name: "movies", x: 0, y: 0, cols: "id bigint pk; title text; duration_min int" },
          { name: "screens", x: 0, y: 220, cols: "id bigint pk; name text; city text" },
          { name: "shows", x: 340, y: 100, cols: "id bigint pk; movie_id bigint ->movies.id; screen_id bigint ->screens.id; starts_at timestamptz", idx: ["movie_id,starts_at", "screen_id"] },
        ]),
      },
      {
        title: "Seats belong to screens",
        story: "Each screen has a fixed seat layout (A1, A2… J20). Every show on that screen uses the same seats.",
        goals: [
          fkGoal("seats.screen_id references screens", seats, "seats", /^(screen|hall)_id$/, "screen_id", screens, "screens"),
          uniqueGoal("A seat label is unique within a screen", seats, "seats", [[/^(screen|hall)_id$/, "screen_id"], [/(label|seat_?no|number|code|name)/, "label (text)"]], "A screen can't have two seats called A7."),
        ],
        antis: [{
          id: "seats-per-show", severity: "warn", title: "Seats copied per show",
          why: "If seats reference shows, you copy the whole seat layout for every show. The layout belongs to the screen. Which seats are booked for a show is a separate table (next step).",
          when: (v) => { const t = seats(v); return t ? t.columns.filter((c) => /^show_id$/.test(c.name.toLowerCase())).map((c) => `${t.name}.${c.name}`) : []; },
        }],
        hints: ["seats: id, screen_id → screens, label (like 'A7').", "Add a UNIQUE index on (screen_id, label)."],
        explain: "Seats are the physical layout, which belongs to a screen. Keeping them separate from shows means 'which seats are taken in this show' becomes its own small table, and that's where the magic happens.",
        solution: buildSchema([
          { name: "movies", x: 0, y: 0, cols: "id bigint pk; title text; duration_min int" },
          { name: "screens", x: 0, y: 220, cols: "id bigint pk; name text; city text" },
          { name: "shows", x: 340, y: 100, cols: "id bigint pk; movie_id bigint ->movies.id; screen_id bigint ->screens.id; starts_at timestamptz", idx: ["movie_id,starts_at", "screen_id"] },
          { name: "seats", x: 340, y: 330, cols: "id bigint pk; screen_id bigint ->screens.id; label text", idx: ["!screen_id,label"] },
        ]),
      },
      {
        title: "Book seats, never twice",
        story: "A booking is made by a user for a show and covers one or more seats. Two users race for seat A7 in the same show at the same millisecond.",
        goals: [
          tableGoal("A users table", users, "users"),
          fkGoal("bookings.user_id references users", bookings, "bookings", /^(user|customer)_id$/, "user_id", users, "users"),
          tableGoal("A table of booked seats (booking_seats)", seatBook, "booking_seats"),
          fkGoal("booking_seats.show_id references shows", seatBook, "booking_seats", /^show_id$/, "show_id", shows, "shows"),
          fkGoal("booking_seats.seat_id references seats", seatBook, "booking_seats", /^seat_id$/, "seat_id", seats, "seats"),
          uniqueGoal("THE rule: (show_id, seat_id) is unique", seatBook, "booking_seats", [[/^show_id$/, "show_id"], [/^seat_id$/, "seat_id"]], "This is what makes double-selling impossible: if two people race for A7, one INSERT fails."),
        ],
        antis: [{
          id: "seat-counter", severity: "warn", title: "Relying on an available_seats counter",
          why: "A counter can't tell which seats are taken, and under concurrency two requests can both read '1 left' and both book. Keep one row per booked seat with a UNIQUE(show_id, seat_id). A counter is fine only as a cached display number.",
          when: (v) => v.s.tables.flatMap((t) => t.columns.filter((c) => /(available|remaining|seats_left|free_seats)/.test(c.name.toLowerCase())).map((c) => `${t.name}.${c.name}`)),
        }],
        hints: [
          "bookings: id, user_id → users, show_id → shows, status, total numeric(10,2).",
          "booking_seats: booking_id → bookings, show_id → shows, seat_id → seats.",
          "Add a UNIQUE index on booking_seats (show_id, seat_id). Yes, show_id is repeated here on purpose, so the database can enforce the rule.",
        ],
        explain: "UNIQUE(show_id, seat_id) on booking_seats moves the 'never twice' rule into the database. Insert all of a booking's seats in one transaction: if any seat is taken, the whole booking rolls back. App-level checks and Redis holds make it fast, and this constraint makes it correct. show_id is copied into booking_seats on purpose, because a constraint can only cover columns in its own table.",
        solution: buildSchema([
          { name: "movies", x: 0, y: 0, cols: "id bigint pk; title text; duration_min int" },
          { name: "screens", x: 0, y: 220, cols: "id bigint pk; name text; city text" },
          { name: "shows", x: 340, y: 100, cols: "id bigint pk; movie_id bigint ->movies.id; screen_id bigint ->screens.id; starts_at timestamptz", idx: ["movie_id,starts_at", "screen_id"] },
          { name: "seats", x: 340, y: 330, cols: "id bigint pk; screen_id bigint ->screens.id; label text", idx: ["!screen_id,label"] },
          { name: "users", x: 1020, y: 0, cols: "id bigint pk; email text unique; name text" },
          { name: "bookings", x: 680, y: 0, cols: "id bigint pk; user_id bigint ->users.id; show_id bigint ->shows.id; status text; total numeric(10,2); created_at timestamptz", idx: ["user_id", "show_id"] },
          { name: "booking_seats", x: 680, y: 280, cols: "id bigint pk; booking_id bigint ->bookings.id; show_id bigint ->shows.id; seat_id bigint ->seats.id", idx: ["!show_id,seat_id", "booking_id", "seat_id"] },
        ]),
      },
    ],
  },
  {
    id: "instagram",
    title: "Instagram: posts, follows, likes",
    blurb: "Self-referencing relations, feed indexes and a denormalised counter.",
    level: "08",
    difficulty: "Interview",
    steps: [
      {
        title: "Users post photos",
        story: "Users post photos with a caption. A profile page shows that user's posts, newest first.",
        goals: [
          tableGoal("A users table", users, "users"),
          uniqueGoal("Usernames are unique", users, "users", [[/(username|handle)/, "username (text)"]], "Two people can't both be @arghya."),
          fkGoal("posts.user_id references users", posts, "posts", /^(user|author|owner)_id$/, "user_id", users, "users"),
          colGoal("The photo is a URL to object storage, not a blob", posts, "posts", /(image|photo|media)_?(url|key|path)?$/, "image_url (text)", ["text", "varchar(255)"]),
          indexGoal("Profile page is fast", posts, "posts", [[/^(user|author|owner)_id$/, "user_id"], [CREATED, "created_at"]], "The profile query is WHERE user_id = ? ORDER BY created_at DESC LIMIT 30."),
        ],
        hints: ["users: id, username (unique). posts: id, user_id → users, caption, image_url, created_at.", "Store the image in S3; keep only its URL in the database.", "Index posts on (user_id, created_at)."],
        explain: "Images belong in object storage, and the database keeps only the URL. The (user_id, created_at) index turns 'latest 30 posts of this user' into a tiny range scan.",
        solution: buildSchema([
          { name: "users", x: 0, y: 0, cols: "id bigint pk; username text unique; created_at timestamptz" },
          { name: "posts", x: 340, y: 0, cols: "id bigint pk; user_id bigint ->users.id; caption text null; image_url text; created_at timestamptz", idx: ["user_id,created_at"] },
        ]),
      },
      {
        title: "Users follow users",
        story: "Users follow other users. You need 'who do I follow?' (to build my feed) and 'who follows me?' (my followers page).",
        goals: [
          tableGoal("A follows table", follows, "follows"),
          fkGoal("follower_id references users", follows, "follows", /^follower_id$/, "follower_id", users, "users"),
          fkGoal("followee_id references users", follows, "follows", /^(followee|following|followed)_id$/, "followee_id", users, "users"),
          uniqueGoal("You can follow someone only once", follows, "follows", [[/^follower_id$/, "follower_id"], [/^(followee|following|followed)_id$/, "followee_id"]], "Double-tapping Follow shouldn't create two rows."),
          indexGoal("“Who follows me?” is fast", follows, "follows", [[/^(followee|following|followed)_id$/, "followee_id"]], "Your key starts with follower_id, which can't answer WHERE followee_id = ?."),
        ],
        hints: ["Both columns point to the same users table. That's fine; it's called a self-referencing relationship.", "follows: follower_id → users, followee_id → users, created_at. Make both PK.", "Add a second index on followee_id."],
        explain: "This is a many-to-many from users to themselves. The composite key (follower_id, followee_id) answers 'who do I follow', and the extra index on followee_id answers 'who follows me'. Celebrities make this hot, which is the famous fan-out problem in the Instagram system puzzle.",
        solution: buildSchema([
          { name: "users", x: 0, y: 0, cols: "id bigint pk; username text unique; created_at timestamptz" },
          { name: "posts", x: 340, y: 0, cols: "id bigint pk; user_id bigint ->users.id; caption text null; image_url text; created_at timestamptz", idx: ["user_id,created_at"] },
          { name: "follows", x: 0, y: 230, cols: "follower_id bigint pk ->users.id; followee_id bigint pk ->users.id; created_at timestamptz", idx: ["followee_id"] },
        ]),
      },
      {
        title: "Likes and like counts",
        story: "Users like posts, once each. The feed shows '1,204 likes' under every post. Counting rows for every post on every feed load is far too slow.",
        goals: [
          fkGoal("likes.user_id references users", likes, "likes", /^user_id$/, "user_id", users, "users"),
          fkGoal("likes.post_id references posts", likes, "likes", /^post_id$/, "post_id", posts, "posts"),
          uniqueGoal("One like per user per post", likes, "likes", [[/^user_id$/, "user_id"], [/^post_id$/, "post_id"]], "Liking twice shouldn't count twice."),
          colGoal("posts has a like_count column (denormalised)", posts, "posts", /like_?count|likes_?count|num_likes/, "like_count (int)", ["int", "bigint"]),
        ],
        hints: ["likes: user_id → users, post_id → posts, both PK.", "Add like_count int to posts and increment it in the same transaction as the insert into likes."],
        explain: "like_count is denormalisation: you store a value you could compute, because reads vastly outnumber writes. Update it in the same transaction as the like insert, or asynchronously in batches for viral posts. The likes table remains the source of truth.",
        solution: buildSchema([
          { name: "users", x: 0, y: 0, cols: "id bigint pk; username text unique; created_at timestamptz" },
          { name: "posts", x: 340, y: 0, cols: "id bigint pk; user_id bigint ->users.id; caption text null; image_url text; like_count int; created_at timestamptz", idx: ["user_id,created_at"] },
          { name: "follows", x: 0, y: 260, cols: "follower_id bigint pk ->users.id; followee_id bigint pk ->users.id; created_at timestamptz", idx: ["followee_id"] },
          { name: "likes", x: 680, y: 0, cols: "user_id bigint pk ->users.id; post_id bigint pk ->posts.id; created_at timestamptz", idx: ["post_id"] },
        ]),
      },
    ],
  },
];

export const dbPuzzleById = (id: string) => DB_PUZZLES.find((p) => p.id === id);
