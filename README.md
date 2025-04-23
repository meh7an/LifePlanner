Every entity in the model has been mapped into a dedicated JavaScript file inside the models/ folder, and all the relationships between them 
are represented using string-based foreign keys (e.g., userId, taskId, postId).

Entity | Relationship (in Conceptual Model) | Implementation in Code
User | Has many Boards, Tasks, Views, Streaks, FocusSessions, Posts, etc. | All these entities include a userId field referencing the owner
Board | Created by a User, contains multiple Lists, can be shared | ownerId in Board.js, boardId in List.js, and resourceId in Share.js
List | Belongs to a Board, contains Tasks | boardId in List.js and listId in Task.js
Task | Belongs to User, Board, List; linked to TaskSteps, Notes, Repeats, FocusSessions, CalendarEvents | References: userId, boardId, listId in Task.js + related entities use taskId
TaskStep | Sub-entity of Task | taskId in TaskStep.js
Note | Belongs to a Task | taskId in Note.js
Repeat | Belongs to a Task | taskId in Repeat.js
Calendar | Belongs to a User, has many CalendarEvents | userId in Calendar.js, calendarId in CalendarEvent.js
CalendarEvent | Belongs to a Calendar, optionally linked to a Task | calendarId, taskId in CalendarEvent.js
Post | Created by a User, linked to Memory and Archive | userId in Post.js, postId in Memory.js and Archive.js
Memory | Belongs to a Post | postId in Memory.js
Archive | Belongs to a Post | postId in Archive.js
View | Customized view saved by a User | userId in View.js
Share | One User gives access to another on Board or Task | ownerId, sharedWithId, resourceType, resourceId
Streak | Tracked per User, per activity type | userId and type in Streak.js
FocusSession | Belongs to User and optionally to a Task | userId, taskId in FocusSession.js

🧱 Entity Naming & Field Design
-All entity IDs (userId, taskId, etc.) are stored as plain strings. This keeps things flexible — you can later switch to UUIDs or ObjectId references if needed.

-Unique constraints (e.g., on email, userId, postId) are enforced using unique: true in schema fields.

-Date fields (e.g., createdAt, updatedAt, lastLogin, startTime) are included to allow sorting, filtering, and reporting.

-Enums are used for values with limited choices (priority, status, viewType, etc.).
