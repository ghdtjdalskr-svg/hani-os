// Reverse only the committed photo-backup UI delta for legacy whole-index checks.
import assert from 'node:assert/strict';
export function withoutPhotoBackupUi(html) {
  const replacements = [
    ["        <p class=\"sub\">PC의 Google Drive 안에 'HANI OS Vault' 폴더를 만들고 선택해 주세요. Google Drive 폴더에 저장하면 자동으로 Drive에 올라가요</p>\n", "        <p class=\"sub\">G: Google Drive 내에 폴더를 만들고 'HANI OS Vault' 폴더를 선택해 주세요.</p>\n"],
    ['        <div class="actions"><button class="btn" id="driveVaultConnect" type="button">백업 폴더 연결</button><button class="btn" id="driveVaultBackup" type="button" disabled>지금 백업</button><button class="btn" id="driveVaultPhotos" type="button" disabled>사진 백업</button></div>\n', '        <div class="actions"><button class="btn" id="driveVaultConnect" type="button">백업 폴더 연결</button><button class="btn" id="driveVaultBackup" type="button" disabled>지금 백업</button></div>\n'],
    ['        <p class="sub">사진은 HANI_OS_photos 폴더에 별도로 보관합니다. PC에서 권한이 유지되면 주간 전체 백업과 함께 저장해요.</p>\n', ''],
    ['        <p class="sub" id="driveVaultPhotoStatus" role="status" aria-live="polite">사진 백업 대기 · 백업 0장 / 신규 0장 / 누락 미확인</p>\n', '']
  ];
  for (const [added, original] of replacements) {
    assert.equal(html.split(added).length - 1, 1, 'one canonical photo UI connection: ' + added.trim());
    html = html.replace(added, original);
  }
  return html;
}
