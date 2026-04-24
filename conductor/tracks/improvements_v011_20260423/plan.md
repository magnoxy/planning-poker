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

## Phase 2: Countdown for Reveal
- [ ] Task: Write Tests for Reveal Countdown
    - [ ] Write unit tests for the countdown timer logic.
    - [ ] Write socket event tests for broadcasting countdown starts.
- [ ] Task: Implement Countdown Sequence
    - [ ] Implement server-side countdown trigger and broadcast.
    - [ ] Implement client-side visual timer overlay/component before showing results.
- [ ] Task: Conductor - User Manual Verification 'Countdown for Reveal' (Protocol in workflow.md)

## Phase 3: Session Persistence
- [ ] Task: Write Tests for Session Persistence
    - [ ] Write tests for saving session IDs/tokens to localStorage or cookies.
    - [ ] Write server tests for reconnecting using a previous session ID.
- [ ] Task: Implement Session Recovery
    - [ ] Update client to store session context on load.
    - [ ] Update server to map reconnecting sockets to existing users/rooms using session ID.
- [ ] Task: Conductor - User Manual Verification 'Session Persistence' (Protocol in workflow.md)

## Phase 4: Admin Transfer
- [ ] Task: Write Tests for Admin Transfer
    - [ ] Write server tests for proposing admin transfer and accepting/rejecting.
- [ ] Task: Implement Admin Transfer Flow
    - [ ] Add UI for current admin to propose transfer to a specific user.
    - [ ] Add UI prompt for the target user to accept/decline.
    - [ ] Update room state on server and broadcast new admin.
- [ ] Task: Conductor - User Manual Verification 'Admin Transfer' (Protocol in workflow.md)

## Phase 5: Direct Card Selection
- [ ] Task: Write Tests for Direct Card Selection
    - [ ] Write tests for setting the active voting card by ID instead of sequential navigation.
- [ ] Task: Implement Direct Selection UI
    - [ ] Add UI for the admin to click on any card in the list to make it active.
    - [ ] Emit socket event to change active card and broadcast to all users.
- [ ] Task: Conductor - User Manual Verification 'Direct Card Selection' (Protocol in workflow.md)