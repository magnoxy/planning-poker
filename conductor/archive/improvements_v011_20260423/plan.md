# Implementation Plan: Improvements v0.1.1

## Phase 1: Card Management [checkpoint: 9a38a2f]
- [x] Task: Write Tests for Card Management
    - [x] Write unit tests for manually adding cards to the store/context.
    - [x] Write unit tests for editing existing cards in the store/context.
- [x] Task: Implement Card Management UI and Logic aeefd4d
    - [x] Create UI components to add a manual card.
    - [x] Create UI components/modals to edit a selected card.
    - [x] Emit socket events and update server state.
- [x] Task: Implement Card Removal and UI Fixes 9c36305
    - [x] Write unit tests for removing cards (server and client).
    - [x] Implement remove card logic on server.
    - [x] Implement remove card logic on client hook.
    - [x] Update UI to include Remove button (admin only) and fix Save/Cancel button sizes.
- [x] Task: Conductor - User Manual Verification 'Card Management' (Protocol in workflow.md)

## Phase 2: Countdown for Reveal [checkpoint: c9f5b73]
- [x] Task: Write Tests for Reveal Countdown
    - [x] Write unit tests for the countdown timer logic.
    - [x] Write socket event tests for broadcasting countdown starts.
- [x] Task: Implement Countdown Sequence
    - [x] Implement server-side countdown trigger and broadcast.
    - [x] Implement client-side visual timer overlay/component before showing results.
- [x] Task: Conductor - User Manual Verification 'Countdown for Reveal' (Protocol in workflow.md)

## Phase 3: Session Persistence
- [x] Task: Write Tests for Session Persistence
    - [x] Write tests for saving session IDs/tokens to localStorage or cookies.
    - [x] Write server tests for reconnecting using a previous session ID.
- [x] Implement Session Recovery
    - [x] Update client to store session context on load.
    - [x] Update server to map reconnecting sockets to existing users/rooms using session ID.
    - [x] Fix admin permission issue: Ensure persistent userId is used instead of transient socketId.
- [x] Task: Conductor - User Manual Verification 'Session Persistence' (Protocol in workflow.md)

## Phase 3.5: Consensus Calculation Fix
- [x] Task: Update consensus logic
    - [x] Modify `calculateConsensus` to compute the average of numeric votes.
    - [x] Ensure non-numeric votes like '?' or '☕' are excluded from the calculation.

## Phase 4: Admin Transfer
- [x] Task: Write Tests for Admin Transfer
    - [x] Write server tests for proposing admin transfer and accepting/rejecting.
- [x] Task: Implement Admin Transfer Flow
    - [x] Add UI for current admin to propose transfer to a specific user.
    - [x] Add UI prompt for the target user to accept/decline.
    - [x] Update room state on server and broadcast new admin.
- [x] Task: Conductor - User Manual Verification 'Admin Transfer' (Protocol in workflow.md)

## Phase 5: Direct Card Selection and Task Reordering
- [x] Task: Write Tests for Direct Card Selection and Points Saving
    - [x] Write tests for setting the active voting card by ID/index instead of sequential navigation.
    - [x] Write tests for saving the consensus points to a specific task.
    - [x] Write tests for reordering tasks.
- [x] Task: Implement Direct Selection and Points UI
    - [x] Add UI for the admin to click on any card in the list to make it active.
    - [x] Emit socket event to change active card and broadcast to all users.
    - [x] Automatically save consensus points to the active task when votes are revealed.
    - [x] Implement drag-and-drop to reorder tasks in the sidebar.
    - [x] Emit socket event to update task order on the server.
- [x] Task: Conductor - User Manual Verification 'Direct Card Selection' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions a844543