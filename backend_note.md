# Backend Instructions for "Account Approve" Feature

To complete the Account Approve feature so that the Admin dashboard can display the user's details, you need to update the `/api/v1/accounts` API to return profile data alongside the base account data.

Currently, the `AccountResponse` DTO only returns `{ id, email, role, status }`. The frontend expects additional fields so it doesn't have to show "N/A".

## Required Backend Changes

1. **Create `AccountProfileResponse` DTO**
   Create a new DTO (e.g. `AccountProfileResponse.java`) that includes:
   ```java
   public record AccountProfileResponse(
           Long id, 
           String email, 
           String role, 
           String status,
           String fullName, 
           String studentCode, 
           String campus, 
           String department, 
           String phone
   ) {}
   ```

2. **Update `AccountService.java`**
   - Inject `LecturerRepository`.
   - Create a new method `getAccountProfiles(AccountStatus status)` that retrieves all `Account` entities.
   - For each `Account`, fetch the associated `Student` (if role is STUDENT) or `Lecturer` (if role is LECTURER) and map the properties into the `AccountProfileResponse`.
   - *Note*: For Students, combine `firstName` and `lastName` to form the `fullName`.

3. **Update `AccountController.java`**
   - Update the `GET /api/v1/accounts` (`list()`) endpoint to return `ApiResponse<List<AccountProfileResponse>>` instead of `AccountResponse`.

The frontend `adminApi.js` has already been updated to parse `fullName`, `studentCode`, and `campus` from the JSON response!
