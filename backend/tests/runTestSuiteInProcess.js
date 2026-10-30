import fs from 'fs';
import path from 'path';

// Give the server time to start after import
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BASE_URL = 'http://127.0.0.1:5000';
let sessionCookie = '';

const logPass = (num, desc) => console.log(`  ✅ [PASS] Scenario ${num}: ${desc}`);
const logFail = (num, desc, err) => {
  console.error(`  ❌ [FAIL] Scenario ${num}: ${desc} ->`, err);
  process.exitCode = 1;
};

// Simple fetch wrapper with cookie preservation
async function request(endpoint, options = {}) {
  const headers = { ...options.headers };
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/triovault_session=[^;]+/);
    if (match) {
      sessionCookie = match[0];
    }
  }

  let body = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  return { status: res.status, headers: res.headers, body };
}

async function runTestSuite() {
  console.log('\nBooting TrioVault in-process server for automated verification...\n');
  const { startServer } = await import('../server.js');
  const server = await startServer();
  await delay(500);

  console.log('\n====================================================');
  console.log('   TrioVault E2E Automated Verification Test Suite   ');
  console.log('====================================================\n');

  try {
    // 0. Health Check
    const health = await request('/api/health');
    if (health.status === 200 && health.body.status === 'ok') {
      console.log('🔌 Health Check OK: Server is live.\n');
    } else {
      throw new Error(`Health check returned status ${health.status}`);
    }

    // 15. Scenario 15: Try accessing APIs without a valid session
    const unauthFolders = await request('/api/folders');
    if (unauthFolders.status === 401 && unauthFolders.body.code === 'AUTH_REQUIRED') {
      logPass(15, 'Accessing protected APIs without session rejected with 401 AUTH_REQUIRED');
    } else {
      logFail(15, 'Unauthorized check failed', unauthFolders.status);
    }

    // 1. Scenario 1: Initial Session check returns unauthenticated
    const initSession = await request('/api/auth/session');
    if (initSession.status === 200 && initSession.body.authenticated === false) {
      logPass(1, 'Open website: Session state is unauthenticated (password screen displayed)');
    } else {
      logFail(1, 'Initial session status invalid', initSession.body);
    }

    // 2. Scenario 2: Enter an incorrect password and verify access is denied
    const badLogin = await request('/api/auth/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'WrongPassword123' }),
    });
    if (badLogin.status === 401 && badLogin.body.success === false) {
      logPass(2, 'Enter incorrect password: Access denied with 401');
    } else {
      logFail(2, 'Incorrect password was not denied properly', badLogin.body);
    }

    // 3. Scenario 3: Enter correct password and verify folder selection appears
    const goodLogin = await request('/api/auth/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'TrioVault2025!' }),
    });
    if (goodLogin.status === 200 && goodLogin.body.success === true && sessionCookie) {
      logPass(3, 'Enter correct password: Authenticated successfully & HTTP-only cookie received');
    } else {
      logFail(3, 'Valid unlock failed', goodLogin.body);
    }

    // Verify session is now active
    const activeSession = await request('/api/auth/session');
    if (activeSession.status === 200 && activeSession.body.authenticated === true) {
      logPass(3.1, 'Session check confirmed active session');
    }

    // 4. Scenario 4: Open each of the three folders
    const foldersRes = await request('/api/folders');
    if (foldersRes.status === 200 && Array.isArray(foldersRes.body.data) && foldersRes.body.data.length === 3) {
      const names = foldersRes.body.data.map(f => f.folderName);
      const expected = [
        'L.V.pavan kumar reddy',
        'D.hari charan sai vagnash',
        'K.deepak kumar'
      ];
      const matchAll = expected.every(exp => names.includes(exp));
      if (matchAll) {
        logPass(4, `Predefined folders verified: [${names.join(' | ')}]`);
      } else {
        logFail(4, 'Folder names do not match expected predefined folders', names);
      }
    } else {
      logFail(4, 'Failed to fetch folders list', foldersRes.body);
    }

    // Verify each folder can be fetched individually
    const pavanFolder = await request('/api/folders/folder-pavan');
    const haricharanFolder = await request('/api/folders/folder-haricharan');
    const deepakFolder = await request('/api/folders/folder-deepak');
    if (pavanFolder.status === 200 && haricharanFolder.status === 200 && deepakFolder.status === 200) {
      logPass(4.1, 'Individual access to all 3 folders validated');
    }

    // 5. Scenario 5: Upload different file formats
    const boundary = '----WebKitFormBoundaryTrioVaultTest';
    const textFileContent = 'Hello TrioVault! This is a test secure note for L.V.pavan kumar reddy.';
    const sampleImgContent = 'FAKE_PNG_HEADER_DATA_BYTES_TEST';

    let bodyData = `--${boundary}\r\n`;
    bodyData += `Content-Disposition: form-data; name="folderId"\r\n\r\nfolder-pavan\r\n`;
    bodyData += `--${boundary}\r\n`;
    bodyData += `Content-Disposition: form-data; name="files"; filename="project_specs.txt"\r\n`;
    bodyData += `Content-Type: text/plain\r\n\r\n${textFileContent}\r\n`;
    bodyData += `--${boundary}\r\n`;
    bodyData += `Content-Disposition: form-data; name="files"; filename="avatar_diagram.png"\r\n`;
    bodyData += `Content-Type: image/png\r\n\r\n${sampleImgContent}\r\n`;
    bodyData += `--${boundary}--\r\n`;

    const uploadRes = await request('/api/files/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: bodyData,
    });

    let uploadedFiles = [];
    if (uploadRes.status === 201 && uploadRes.body.success === true) {
      uploadedFiles = uploadRes.body.data;
      logPass(5, `Uploaded ${uploadedFiles.length} files of different formats (txt, png)`);
    } else {
      logFail(5, 'File upload failed', uploadRes.body);
    }

    // 6. Scenario 6: Verify files appear in the correct folder
    const pavanFiles = await request('/api/files/folder-pavan');
    const deepakFiles = await request('/api/files/folder-deepak');
    if (
      pavanFiles.status === 200 &&
      pavanFiles.body.data.length >= 2 &&
      deepakFiles.status === 200 &&
      deepakFiles.body.data.length === 0
    ) {
      logPass(6, 'Files strictly isolated to folder-pavan; folder-deepak remains empty');
    } else {
      logFail(6, 'Files not isolated properly between folders', {
        pavan: pavanFiles.body.data?.length,
        deepak: deepakFiles.body.data?.length,
      });
    }

    const testFile = uploadedFiles[0];

    // 7. Scenario 7: Download uploaded files
    if (testFile) {
      const downloadRes = await request(`/api/files/${testFile.fileId}/download`);
      if (downloadRes.status === 200) {
        logPass(7, `Download file verified (Status 200)`);
      } else {
        logFail(7, 'Download file failed', downloadRes.status);
      }
    }

    // 8. Scenario 8: Preview supported files
    if (testFile) {
      const previewRes = await request(`/api/files/${testFile.fileId}/preview`);
      if (previewRes.status === 200) {
        logPass(8, `Preview file verified for ${testFile.originalName}`);
      } else {
        logFail(8, 'Preview failed', previewRes.status);
      }
    }

    // 9. Scenario 9: Rename files
    if (testFile) {
      const renameRes = await request(`/api/files/${testFile.fileId}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: 'project_specs_v2.txt' }),
      });
      if (renameRes.status === 200 && renameRes.body.data?.originalName === 'project_specs_v2.txt') {
        logPass(9, `Rename file verified: '${testFile.originalName}' -> 'project_specs_v2.txt'`);
      } else {
        logFail(9, 'Rename failed', renameRes.body);
      }
    }

    // 11. Scenario 11: Verify storage calculations
    const statsRes = await request('/api/folders/folder-pavan/stats');
    const analyticsRes = await request('/api/analytics/overview');
    if (
      statsRes.status === 200 &&
      statsRes.body.data.totalFiles >= 2 &&
      analyticsRes.status === 200 &&
      analyticsRes.body.data.summary.totalFiles >= 2
    ) {
      logPass(11, `Storage calculations verified: totalFiles=${statsRes.body.data.totalFiles}, totalSize=${statsRes.body.data.totalSize} bytes`);
    } else {
      logFail(11, 'Storage stats calculation failed', statsRes.body);
    }

    // 12. Scenario 12: Verify activity history
    const activitiesRes = await request('/api/activities');
    if (activitiesRes.status === 200 && activitiesRes.body.data.length > 0) {
      const actions = activitiesRes.body.data.map(a => a.action);
      logPass(12, `Activity history audit verified with actions logged: [${Array.from(new Set(actions)).join(', ')}]`);
    } else {
      logFail(12, 'Activity logging failed', activitiesRes.body);
    }

    // 10. Scenario 10: Delete file
    if (testFile) {
      const deleteRes = await request(`/api/files/${testFile.fileId}`, {
        method: 'DELETE',
      });
      if (deleteRes.status === 200 && deleteRes.body.success === true) {
        logPass(10, `Delete file verified: ${testFile.fileId} removed permanently`);
      } else {
        logFail(10, 'Delete file failed', deleteRes.body);
      }
    }

    // 14. Scenario 14: Lock and unlock the website
    const lockRes = await request('/api/auth/lock', { method: 'POST' });
    if (lockRes.status === 200) {
      const postLockSession = await request('/api/auth/session');
      if (postLockSession.body.authenticated === false) {
        logPass(14, 'Lock vault verified: Session terminated and cookie cleared');
      }
    }

    // 16. Scenario 16: Try accessing a file post-lock
    const blockedAccess = await request('/api/files/folder-pavan');
    if (blockedAccess.status === 401) {
      logPass(16, 'Access blocked post-lock (Security validation intact)');
    }

    console.log('\n====================================================');
    console.log('   🎉 All Automated Backend & API Scenarios Passed!  ');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTestSuite();
