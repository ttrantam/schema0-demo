// import type { User } from "@template/auth";
// import { AsyncLocalStorage } from "node:async_hooks";

// const USER = new AsyncLocalStorage<User>();

// export async function provideUser(
//   request: Request,
//   cb: () => Promise<Response>,
// ) {
//   let user = await getUser(request);
//   return USER.run(user, cb);
// }

// export function getUser() {
//   return USER.getStore();
// }
