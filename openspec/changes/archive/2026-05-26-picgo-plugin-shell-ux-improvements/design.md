## Context

`picgo-headless-publisher-contract` separated the reusable PicGo libraries from the `siyuan-plugin-picgo` plugin product. The next set of issues is product-shell UX inside the PicGo plugin itself.

Current pain points:

- The main PicGo UI is opened through a SiYuan dialog-style interaction. For frequent settings and upload actions, a DOM-mounted popup or side panel is lighter and closer to the expected Publisher-style interaction.
- Opening the main UI can trigger migration/init checks repeatedly. Migration should be a bounded lifecycle operation, not a side effect of every UI open.
- Some configuration changes affect plugin menus or runtime registrations. SiYuan menus may not observe those changes immediately, so the UI must tell the user when reload is required.

## Goals / Non-Goals

**Goals:**

- Provide a plugin shell surface that opens from the plugin entry as a mounted popup anchored near the PicGo topbar button rather than a dialog-first flow.
- Ensure migration/init work is idempotent and not triggered by routine UI opening after completion.
- Detect configuration changes that require runtime/menu refresh and show clear manual reload messaging in the UI.
- Preserve existing PicGo settings and upload behavior while improving shell interaction.

**Non-Goals:**

- Do not change the headless PicGo library contract that Publisher consumes.
- Do not implement Publisher UI in this repository.
- Do not introduce a shared Vue UI package for external consumers.
- Do not redesign all settings pages; this change is about plugin shell behavior and reload guidance.
- Do not add programmatic plugin reload for this change; the refresh path is manual because menu/runtime refresh depends on the plugin and SiYuan lifecycle.

## Decisions

### 1. Use a mounted topbar-anchored popup shell instead of dialog-first opening

The plugin shell should mount a controlled DOM container from `picgo-plugin-bootstrap`. The initial product behavior is a popup anchored near the PicGo topbar button. The popup hosts the existing app bundle in an iframe and is owned by bootstrap.

Rationale:

- The shell can be opened/closed without creating a new SiYuan dialog each time.
- The surface can behave like a lightweight tool panel for frequent plugin actions.
- Bootstrap remains the owner of SiYuan host integration, while `picgo-plugin-app` remains the UI app.
- Anchoring near the topbar button keeps the interaction local to the entry users clicked and avoids introducing a larger right-side panel layout decision in this change.

Alternative considered: keep SiYuan dialog and only tune size/position. This does not address the core interaction problem and keeps the heavy dialog lifecycle.

Alternative considered: implement a right-side panel. This remains a possible future enhancement, but the confirmed first version is the topbar-adjacent popup.

### 2. Move migration gating out of routine UI open

Migration/init checks should be guarded by explicit state:

- already completed for the current config path/version
- currently running
- failed and needs retry

The UI may display migration state, but opening the UI must not itself start repeated migration work after migration has completed.

Rationale:

- Migration is a lifecycle concern, not a view-open concern.
- Repeated migration work creates confusing logs and user-facing noise.

Alternative considered: debounce migration on UI open. This hides the symptom but still couples migration to view lifecycle.

### 3. Show explicit manual reload-required state after runtime-affecting config changes

When a configuration change affects plugin menus, commands, status bar entries, or runtime registration state, the UI should show a clear message such as “配置已保存，部分菜单需要重载插件后生效”. The message must explain that this is not a failed settings save; it is caused by the plugin and SiYuan lifecycle. The confirmed refresh path for this change is manual: disable/enable the plugin in SiYuan plugin settings or restart SiYuan, then clear the notice.

Rationale:

- SiYuan menu state may not update live after config mutation.
- Silent stale menus are worse than an explicit reload notice.
- Programmatic plugin reload is not introduced here because safe reload support is not treated as guaranteed across supported SiYuan versions.

Alternative considered: attempt to rebuild all menus live after every config change. This can be added later, but the first requirement is correct user feedback.

Alternative considered: call a SiYuan/plugin reload API automatically. This change deliberately does not do that; user-facing instructions are safer and match the confirmed requirement.

## Risks / Trade-offs

- [Risk] DOM-mounted shell may conflict with SiYuan layout or z-index rules. → Mitigation: isolate shell container, use a single owner, and provide deterministic unmount.
- [Risk] Migration state may already be spread across `SiyuanPicGo`, post API, and bootstrap code. → Mitigation: trace current call sites before editing and introduce a narrow guard rather than broad refactor.
- [Risk] Reload-required detection may initially be conservative. → Mitigation: start with known menu/runtime-affecting settings and document the criteria.
- [Risk] Users may expect live menu refresh. → Mitigation: provide clear copy and an explicit reload action when supported.

## Migration Plan

1. Keep existing dialog path available until the mounted shell is verified in the SiYuan `test` workspace.
2. Add migration state guard and confirm opening the UI multiple times does not re-run completed migration.
3. Add reload-required message for menu/runtime-affecting configuration changes.
4. Verify existing upload and settings flows still work.
5. Remove or demote the old dialog-first path only after the mounted shell passes smoke testing.

## Resolved Questions

- Shell placement: topbar-adjacent popup for the first implementation.
- Refresh behavior: manual reload/restart instructions only; do not add programmatic plugin reload in this change.
- Reload-required scope: mark operations that affect PicGo plugin runtime registration, including install/import/enable/disable/uninstall/update of PicGo plugins. Also mark SiYuan host document/paste listener settings such as clipboard auto upload, local-link replacement, and mixed text+image paste upload because already-open documents and host event handlers do not reliably refresh those behaviors live. Ordinary uploader/image-bed value edits remain normal saved configuration and do not need a runtime reload notice unless they change runtime registration state.
