# Backend Tasks: Update Student Info & Change Password

The frontend has been updated to include a "My Settings" page where Students and Lecturers can update their profiles and change their passwords. Please implement the following APIs in the backend to support these features.

## 1. Student Profile Update

**Endpoint**: `PUT /api/v1/students/me`
**Required Roles**: `STUDENT`

### Payload Update
Update `StudentRequest.java` to accept `studentCode` and `email`:
```java
public record StudentRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        @Size(max = 100) String campus,
        @Size(max = 20) String studentCode, // NEW
        @Email String email // NEW
) {}
```
Also update `StudentResponse.java` to return the `studentCode`.

### Business Logic
In `StudentService.updateMyProfile`:
1. Check if the provided `studentCode` matches the `^SE\d{6}$` regex. If not, throw a `BusinessException("Student code must be in the format SEXXXXXX")`.
2. Check if the `studentCode` has changed from the current student's code. If it has changed, verify that it is not already taken by calling `studentRepository.existsByStudentCode(req.studentCode())`. If it exists, throw a `BusinessException("Student ID already exists")`.
3. Check if the `email` has changed from the current user's email. If it has changed, verify it is not taken by another account, then update the `Account` table with the new email.
4. Save the updated profile and account.

---

## 2. Lecturer Profile Update

**Endpoint**: `PUT /api/v1/lecturers/me`
**Required Roles**: `LECTURER`

### Payload
Create or update `LecturerRequest.java`:
```java
public record LecturerRequest(
        @Size(max = 100) String fullName,
        @Size(max = 100) String department,
        @Size(max = 100) String campus,
        @Size(max = 20) String phone,
        @Email String email // NEW
) {}
```

### Business Logic
In `LecturerService.updateMyProfile`:
1. Find the lecturer profile by the authenticated user's account ID.
2. Check if the `email` has changed. If it has, verify it is not taken by another account, then update the `Account` table with the new email.
3. Update the fields and save the profile and account.

---

## 3. Change Password

**Endpoint**: `PUT /api/v1/auth/change-password`
**Required Roles**: Authenticated users (Any role)

### Payload
Create `ChangePasswordRequest.java` in `com.fpt.seal.hms.auth.dto`:
```java
public record ChangePasswordRequest(
        @NotBlank String oldPassword,
        @NotBlank @Size(min = 6) String newPassword
) {}
```

### Business Logic
In `AccountService.java` (or handled via `AuthController`):
1. Fetch the account by the authenticated user's email.
2. Verify the old password matches: `passwordEncoder.matches(req.oldPassword(), account.getPassword())`.
3. If it does not match, throw `BusinessException("Incorrect old password")`.
4. If it matches, update the password: `account.setPassword(passwordEncoder.encode(req.newPassword()))`.
5. Save the account.
