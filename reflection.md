# Project Reflection

## What Was Hard vs. Easy

### Hard
- Coming up with the initial comprehensive set of concepts was tricky. It took a lot of thought to capture everything I wanted while keeping it modular.
- Many of my early concepts were too bulky, so breaking them down into smaller components took time and multiple revisions.
- Thinking in a more abstract, application-independent way during concept brainstorming.
- Iterating with the agentic tool in VS Code was sometimes frustrating. It occasionally changed code without explanation, which made debugging harder.
- Understanding syncs and the rationale behind the new action server with the Requesting concept took a while to fully click. I eventually understood how it allowed for more controlled and secure interactions.
- Implementing email verification was a challenge. I first tried Resend, but that required a custom domain. I switched to using Google SMTP, which worked locally, but Render’s free tier blocks outgoing SMTP connections. In the end, I caught the email-sending error and printed the verification code to the console instead, and just retreiving the verification code from my database for my demo.

### Easy
- Using the Context tool to generate and iterate on concept code felt very natural and saved a lot of time.
- The provided generation scripts were simple to use and made rebuilding files simple.
- Creating and updating test suites using the Context tool was easy to iterate on as my concepts evolved.
- Building the frontend UI after sketching it out was enjoyable. I used the agentic tool to scaffold the layout from my UI sketches and then refined the details myself.
- Deploying and connecting the frontend and backend went smoothly once my environment variables were set up correctly.

## What Went Well
- Successfully deploying both the frontend and backend was a big milestone, and it felt great to be able to share my app with friends and family.
- The email utility I built handled SMTP errors gracefully instead of crashing, which made the system more robust.
- Working on the frontend design, like experimenting with colors, typography, and layout, was fun and helped me realize how much I enjoy the design side of development.
- I appreciated having full creative freedom in this project. Early on, I thought the concept design process was tedious, but I later saw how it made implementation much smoother and more organized.

## Mistakes and Lessons
- I learned that agentic tools work best when given smaller, specific tasks rather than large, open-ended ones. Smaller iterations made debugging and refinement much easier as well for both me and the agent.
- Early on, I over-logged everything, which made debugging overwhelming. I now use more selective and rate-limited logging.
- I wasn’t thorough enough in my early assignments, which cost me a lot of extra work and time later on. I’ve learned that investing time upfront in clear design saves a lot of effort later on.
- I used to think coding was the hardest and most important part of building an application, but now I understand that design and planning matter even more. With solid design, both manual coding and AI-assisted development become faster and more effective.

## Skills Gained
- Strengthened full-stack skills by hosting separate frontend and backend servers and connecting them.
- Gained experience working with MongoDB and integrating it into a backend.
- Learned how to deploy and manage services on Render.
- Applied concepts from 6.1020, like asynchronous design and rate limiting, to a real-world app.
- Improved design practices by learning to think more intentionally about layout, color, typography, and user experience during frontend development.
- The overall framework of this class: starting from brainstorming and concept design, then building the backend, frontend, and finally deploying a complete full-stack application.

## Areas to Grow
- I want to get better at frontend design, learning more frameworks and design principles to build more visually appealing interfaces.
- I’d like to improve my backend architecture and learn more best practices for writing scalable and maintainable code.
- I still want a deeper understanding of MongoDB and data modeling, especially for larger production-scale applications.

## Use of Context and Agentic Tools

### Context Tool
- Generated concept implementations directly from my concept specifications and fed the generated code back into the tool to iterate on.
- Generated test suites for my concept implementations and updated my test suites as I added new actions.

### Agentic Coding Tool
- Helped fix bugs, improve styling, and generate TS-docs for my code.
- Served as both an advisor and a coding partner. I could ask for suggestions, get example implementations, and iterate on them quickly.
- Saved me significant time solving tricky issues, like getting the frontend to refresh correctly after creating a new post.

## Role of LLMs in Software Development
- I believe LLMs are powerful assistants for handling tedious or repetitive tasks like debugging, documenting, and generating boilerplate code, but they can’t replace human design judgment.
- They greatly accelerate development and iteration, but it’s still crucial for developers to understand their systems in depth to deploy, optimize, and secure them effectively.
- When used well, I believe they make development much faster, more creative, and more focused on higher-level thinking rather than syntax.
