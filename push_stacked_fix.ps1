$ErrorActionPreference = "Continue"

Write-Host "Cleaning up old remote branches..."
$oldBranches = @(
    "feature/JS-02", "feature/TM-02",
    "feature/EV-01-EV-02-EV-03-EV-04-EV-06",
    "feature/TM-01-TM-03-TM-04",
    "feature/SU-01-SU-02-SU-03-SU-04"
)
foreach ($b in $oldBranches) {
    git push origin --delete $b 2>$null
}

$ErrorActionPreference = "Stop"

$SRC_EV = "feature/EV-competition-setup"
$SRC_TM = "feature/P3-team"
$SRC_SU = "feature/P4-submission"

# 1. EV branch
$evBranch = "feature/EV-01-EV-02-EV-03-EV-04-EV-06"
Write-Host "`n========== Creating $evBranch ==========" -ForegroundColor Cyan
git checkout -B $evBranch origin/develop
git checkout $SRC_EV -- backend/src/main/java/com/fpt/seal/hms/event backend/src/main/java/com/fpt/seal/hms/round backend/src/main/java/com/fpt/seal/hms/track backend/src/main/java/com/fpt/seal/hms/topic backend/src/main/java/com/fpt/seal/hms/common/enums/EventStatus.java backend/src/main/java/com/fpt/seal/hms/common/enums/RoundStatus.java backend/src/main/resources/db/migration/V2__add_round_sequence.sql backend/src/main/resources/db/migration/V3__clean_up_track_and_topic.sql
git add .
git commit -m "feat(event-core): Event, Round, Track setup (EV-01 to EV-06)"
git push -u origin $evBranch -f

# 2. JS branch
$jsBranch = "feature/JS-02"
Write-Host "`n========== Creating $jsBranch ==========" -ForegroundColor Cyan
git checkout -B $jsBranch $evBranch
git checkout $SRC_EV -- backend/src/main/java/com/fpt/seal/hms/criterion
git add .
git commit -m "feat(criterion): Criterion setup (JS-02)"
git push -u origin $jsBranch -f

# 3. TM-01 branch
$tm1Branch = "feature/TM-01-TM-03-TM-04"
Write-Host "`n========== Creating $tm1Branch ==========" -ForegroundColor Cyan
git checkout -B $tm1Branch $jsBranch
git checkout $SRC_TM -- backend/src/main/java/com/fpt/seal/hms/team backend/src/main/java/com/fpt/seal/hms/chapter backend/src/main/java/com/fpt/seal/hms/common/enums/TeamStatus.java backend/src/main/resources/db/migration/V4__add_event_id_to_team.sql
git add .
git commit -m "feat(team): Team creation and approval (TM-01, TM-03, TM-04)"
git push -u origin $tm1Branch -f

# 4. TM-02 branch
$tm2Branch = "feature/TM-02"
Write-Host "`n========== Creating $tm2Branch ==========" -ForegroundColor Cyan
git checkout -B $tm2Branch $tm1Branch
git checkout $SRC_TM -- backend/src/main/java/com/fpt/seal/hms/teammember backend/src/main/java/com/fpt/seal/hms/common/enums/MemberRole.java backend/src/main/java/com/fpt/seal/hms/account/dto
git add .
git commit -m "feat(team-member): Team member management (TM-02)"
git push -u origin $tm2Branch -f

# 5. SU branch
$suBranch = "feature/SU-01-SU-02-SU-03-SU-04"
Write-Host "`n========== Creating $suBranch ==========" -ForegroundColor Cyan
git checkout -B $suBranch $tm2Branch
git checkout $SRC_SU -- backend/src/main/java/com/fpt/seal/hms/submission backend/src/main/java/com/fpt/seal/hms/roundranking backend/src/main/java/com/fpt/seal/hms/common/enums/SubmissionStatus.java
git add .
git commit -m "feat(submission): Submission management (SU-01 to SU-04)"
git push -u origin $suBranch -f

Write-Host "`n========== SUCCESS! All stacked branches fixed! ==========" -ForegroundColor Green
