export { MOCK_USER } from "./model/mock-user";
export type { UserProfile } from "./model/types";
export {
  createUserRecordInDb,
  ensureUserRecordInDb,
  getDefaultUserNameFromEmail,
  getInitialsFromName,
  updateUserNameInDb,
  updateUserPhotoInDb,
  type UserDatabaseRecord,
} from "./model/user-db";
export { useCurrentUser, type CurrentUserState } from "./model/use-current-user";
