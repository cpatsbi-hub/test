// ═══════════════════════════════════════════════════════════
//  SEVA SARATHI – MALAPPURAM  |  Google Apps Script Backend
//  v2.0 – Dynamic Parameter Management
//  Paste ENTIRE file in Apps Script editor → Save → Deploy as Web App
//  Execute as: Me | Who has access: Anyone
// ═══════════════════════════════════════════════════════════

const SS_ID = '1KmZNybHExXAGB9SYymwpF1UyS3R-6qEjyiRIiN5icgg';
const DEFAULT_PASSWORD = 'Sbi@1234';

// ── Sheet names ──
const SH = {
  USERS:      'SS_Users',
  ATTENDANCE: 'SS_Attendance',
  REPORTS:    'SS_ServiceReport',
  MASTER:     'SS_MasterData',
  BUDGET:     'SS_Budget',
  HOLIDAYS:   'SS_Holidays',
  PARAMS:     'SS_Params'          // ← NEW: Dynamic parameters
};

// ── Default parameters (seeded if SS_Params sheet is empty) ──
const DEFAULT_PARAMS = [
  {id:'p1',  name:'YONO Registration',                       short:'YONO Reg',  channel:'yono',  wt:2, active:true},
  {id:'p2',  name:'WhatsApp Banking Reg',                    short:'WA Reg',    channel:'wb',    wt:2, active:true},
  {id:'p3',  name:'CBDC Registration',                       short:'CBDC',      channel:'other', wt:2, active:true},
  {id:'p4',  name:'YONO Cash (Withdrawal & Deposit)',        short:'YONO Cash', channel:'yono',  wt:1, active:true},
  {id:'p5',  name:'CDM/GCC Deposit',                         short:'CDM/GCC',   channel:'other', wt:1, active:true},
  {id:'p6',  name:'Feedbacks',                               short:'Feedback',  channel:'other', wt:1, active:true},
  {id:'p7',  name:'APY Done',                                short:'APY',       channel:'other', wt:1, active:true},
  {id:'p8',  name:'Term Deposit (YONO)',                     short:'Term Dep',  channel:'yono',  wt:1, active:true},
  {id:'p9',  name:'PAI Done (YONO)',                         short:'PAI',       channel:'yono',  wt:1, active:true},
  {id:'p10', name:'ATM Card Issue (YONO/Toll Free)',         short:'ATM Card',  channel:'tf',    wt:1, active:true},
  {id:'p11', name:'Cheque Book Issue',                       short:'Chq Book',  channel:'yono',  wt:1, active:true},
  {id:'p12', name:'Form 15G/H',                              short:'15G/H',     channel:'yono',  wt:1, active:true},
  {id:'p13', name:'KYC Update',                              short:'KYC',       channel:'yono',  wt:1, active:true},
  {id:'p14', name:'Nominee Update (YONO)',                   short:'Nominee',   channel:'yono',  wt:1, active:true},
  {id:'p15', name:'Transfer Done (YONO)',                    short:'Transfer',  channel:'yono',  wt:1, active:true},
  {id:'p16', name:'Statement & Enquiry',                     short:'Stmt/Enq',  channel:'tf',    wt:1, active:true}
];

const INITIAL_MASTER = [
  ['MALAPPURAM','ANJALI K','SS001'],
  ['KOTTAKKAL','ASWATHY M K','SS002'],
  ['PUTHANATHANI','GOPIKA','SS003'],
  ['PULAMANTHOLE','ATHIRA N','SS004'],
  ['VALANCHERRY','ANAGHA M','SS005'],
  ['PERINTHALMANNA','ARATHI ANIL','SS006'],
  ['POOKKOTTUMPADAM','ANOOP','SS007'],
  ['MALAPPURAM CIVIL STATION','AJMAL','SS008'],
  ['KARUVARAKUNDU','NANDHANA A','SS009'],
  ['NRI TIRUR','VINITHA M','SS010'],
  ['MANIMOOLY','SANJAY P S','SS011'],
  ['WANDOOR','PRASANTH K','SS012'],
  ['TIRUR','ASWATHY S K','SS013'],
  ['PANG SOUTH PANG','SARANYA T','SS014'],
  ['EDAPPAL TOWN','ASHEEN','SS015'],
  ['PONNANI','ASWATHY A K','SS016'],
  ['EDAKKARA','RUKSANA THASNI K H','SS017'],
  ['PANDIKKAD','SRUTHI P V','SS018'],
  ['CHANGARAMKULAM','SINDHU','SS019'],
  ['KUTTIPURAM','ASHA KRISHNAN K P','SS020'],
  ['MANJERI','SRUTHI K M','SS021'],
  ['MELATTUR','MOHAMAD SHAHEER KALATHINGAL THODI','SS022']
];

// ═══════════════════════════════════════
//  ENTRY POINTS
// ═══════════════════════════════════════
function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    const p = {};
    if (e && e.parameter && e.parameter.action) {
      p.action = e.parameter.action;
      const raw = e.parameter.payload || '{}';
      let parsed = {};
      try { parsed = JSON.parse(raw); } catch(_) {}
      Object.assign(p, parsed);
    } else if (e && e.postData && e.postData.contents) {
      let parsed = {};
      try { parsed = JSON.parse(e.postData.contents); } catch(_) {}
      Object.assign(p, parsed);
    } else {
      return jsonOut({success:false, error:'No action provided'});
    }

    const action = String(p.action || '');
    let result;

    switch (action) {
      // ── Utility ──
      case 'ping':             result = {success:true, msg:'Connected', time:now()}; break;
      case 'setupSheets':      result = setupSheets(); break;
      // ── User ──
      case 'login':            result = login(p); break;
      case 'validateSession':  result = validateSession(p); break;
      case 'changePassword':   result = changePassword(p); break;
      case 'markAttendance':   result = markAttendance(p); break;
      case 'getAttendance':    result = getAttendance(p); break;
      case 'submitReport':     result = submitReport(p); break;
      case 'getReport':        result = getReport(p); break;
      case 'getBudget':        result = getBudget(p); break;
      case 'getMasterData':    result = getMasterData(); break;
      // ── Params ──
      case 'getParams':        result = getParams(); break;
      // ── Admin ──
      case 'admin_getDashboard':   result = admin_getDashboard(p); break;
      case 'admin_getAttendance':  result = admin_getAttendance(p); break;
      case 'admin_getReports':     result = admin_getReports(p); break;
      case 'admin_getMasterData':  result = admin_getMasterData(); break;
      case 'admin_addBranch':      result = admin_addBranch(p); break;
      case 'admin_removeBranch':   result = admin_removeBranch(p); break;
      case 'admin_getBudgets':     result = admin_getBudgets(p); break;
      case 'admin_saveBudget1':    result = admin_saveBudget1(p); break;
      case 'admin_getHolidays':    result = admin_getHolidays(); break;
      case 'admin_addHoliday':     result = admin_addHoliday(p); break;
      case 'admin_removeHoliday':  result = admin_removeHoliday(p); break;
      case 'admin_getEfficiency':  result = admin_getEfficiency(p); break;
      case 'admin_getUsers':       result = admin_getUsers(); break;
      case 'admin_resetPassword':  result = admin_resetPassword(p); break;
      // ── Admin Params Management ──
      case 'admin_getParams':      result = admin_getParams(); break;
      case 'admin_addParam':       result = admin_addParam(p); break;
      case 'admin_updateParam':    result = admin_updateParam(p); break;
      case 'admin_deleteParam':    result = admin_deleteParam(p); break;
      case 'admin_reorderParams':  result = admin_reorderParams(p); break;
      default: result = {success:false, error:'Unknown action: ' + action};
    }
    return jsonOut(result);
  } catch(err) {
    Logger.log('ERROR in handleRequest: ' + err.toString() + '\n' + err.stack);
    return jsonOut({success:false, error:err.toString()});
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════
//  SHEET UTILITIES
// ═══════════════════════════════════════
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SS_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    seedSheet(sh, name);
  }
  return sh;
}

function seedSheet(sh, name) {
  switch (name) {
    case SH.USERS:
      sh.appendRow(['EmpCode','Branch','Name','Password','FirstLogin','Active']);
      INITIAL_MASTER.forEach(m => sh.appendRow([m[2], m[0], m[1], DEFAULT_PASSWORD, 'TRUE', 'TRUE']));
      break;
    case SH.MASTER:
      sh.appendRow(['Branch','Name','EmpCode']);
      INITIAL_MASTER.forEach(m => sh.appendRow([m[0], m[1], m[2]]));
      break;
    case SH.ATTENDANCE:
      sh.appendRow(['Date','EmpCode','Branch','Name','Status','Timestamp']);
      break;
    case SH.REPORTS:
      // Headers will be rebuilt dynamically; just seed the static columns
      sh.appendRow(['Date','EmpCode','Branch','Name','Params_JSON','Score','Timestamp']);
      break;
    case SH.BUDGET:
      sh.appendRow(['Branch','Month','Params_JSON']);
      break;
    case SH.HOLIDAYS:
      sh.appendRow(['Date','Description']);
      break;
    case SH.PARAMS:
      sh.appendRow(['ID','Name','Short','Channel','Weight','Active','SortOrder']);
      DEFAULT_PARAMS.forEach((p, i) =>
        sh.appendRow([p.id, p.name, p.short, p.channel, p.wt, 'TRUE', i+1])
      );
      break;
  }
}

function getSheetData(name) {
  const sh = getSheet(name);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim());
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      const v = row[i];
      if (Object.prototype.toString.call(v) === '[object Date]') {
        obj[h] = isNaN(v) ? '' : Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd');
      } else {
        obj[h] = v;
      }
    });
    return obj;
  });
}

function isTruthy(v) {
  if (v === true || v === 1) return true;
  if (typeof v === 'string') return v.trim().toUpperCase() === 'TRUE';
  return false;
}

function now() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
}

function toDateStr(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isNaN(v) ? '' : Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd');
  }
  return String(v).substring(0, 10);
}

// ── Generate a unique param ID ──
function generateParamId() {
  const rows = getSheetData(SH.PARAMS);
  const usedIds = new Set(rows.map(r => String(r.ID || '')));
  // Find highest numeric suffix
  let maxNum = 0;
  usedIds.forEach(id => {
    const m = id.match(/^p(\d+)$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  });
  // Also try p-prefixed custom IDs
  let newId = 'p' + (maxNum + 1);
  while (usedIds.has(newId)) { maxNum++; newId = 'p' + (maxNum + 1); }
  return newId;
}

// ═══════════════════════════════════════
//  DYNAMIC PARAMS API
// ═══════════════════════════════════════

/**
 * Returns all ACTIVE params sorted by SortOrder.
 * Used by both user-facing and admin interfaces.
 */
function getParams() {
  try {
    const rows = getSheetData(SH.PARAMS);
    const active = rows
      .filter(r => isTruthy(r.Active))
      .sort((a, b) => (Number(a.SortOrder)||0) - (Number(b.SortOrder)||0))
      .map(r => ({
        id:      String(r.ID      || ''),
        name:    String(r.Name    || ''),
        short:   String(r.Short   || r.Name || '').substring(0, 14),
        channel: String(r.Channel || 'other'),
        wt:      Number(r.Weight  || 1),
        order:   Number(r.SortOrder || 0)
      }));
    return {success:true, params: active};
  } catch(e) {
    Logger.log('getParams error: ' + e);
    return {success:false, error:e.toString()};
  }
}

function admin_getParams() {
  try {
    const rows = getSheetData(SH.PARAMS);
    const all = rows
      .sort((a, b) => (Number(a.SortOrder)||0) - (Number(b.SortOrder)||0))
      .map(r => ({
        id:      String(r.ID      || ''),
        name:    String(r.Name    || ''),
        short:   String(r.Short   || ''),
        channel: String(r.Channel || 'other'),
        wt:      Number(r.Weight  || 1),
        active:  isTruthy(r.Active),
        order:   Number(r.SortOrder || 0)
      }));
    return {success:true, params: all};
  } catch(e) {
    return {success:false, error:e.toString()};
  }
}

function admin_addParam(p) {
  try {
    const name    = String(p.name    || '').trim();
    const short   = String(p.short   || '').trim().substring(0, 14) || name.substring(0, 14);
    const channel = String(p.channel || 'other').trim();
    const wt      = Math.max(1, Math.min(5, parseInt(p.wt) || 1));
    if (!name) return {success:false, error:'Parameter name is required'};

    const sh   = getSheet(SH.PARAMS);
    const rows = getSheetData(SH.PARAMS);
    const maxOrder = rows.reduce((m, r) => Math.max(m, Number(r.SortOrder)||0), 0);
    const newId = generateParamId();

    sh.appendRow([newId, name, short, channel, wt, 'TRUE', maxOrder + 1]);
    return {success:true, id: newId};
  } catch(e) {
    return {success:false, error:e.toString()};
  }
}

function admin_updateParam(p) {
  try {
    const id = String(p.id || '').trim();
    if (!id) return {success:false, error:'Missing param ID'};

    const sh   = getSheet(SH.PARAMS);
    const data = sh.getDataRange().getValues();
    // headers: ID, Name, Short, Channel, Weight, Active, SortOrder
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) {
        if (p.name    !== undefined) sh.getRange(i+1, 2).setValue(String(p.name).trim());
        if (p.short   !== undefined) sh.getRange(i+1, 3).setValue(String(p.short).trim().substring(0,14));
        if (p.channel !== undefined) sh.getRange(i+1, 4).setValue(String(p.channel).trim());
        if (p.wt      !== undefined) sh.getRange(i+1, 5).setValue(Math.max(1, Math.min(5, parseInt(p.wt)||1)));
        if (p.active  !== undefined) sh.getRange(i+1, 6).setValue(p.active ? 'TRUE' : 'FALSE');
        return {success:true};
      }
    }
    return {success:false, error:'Parameter not found'};
  } catch(e) {
    return {success:false, error:e.toString()};
  }
}

/**
 * Delete a parameter. This marks it inactive rather than hard-deleting
 * so historical report data referencing this param ID is preserved.
 * Pass {hardDelete: true} to permanently remove from sheet.
 */
function admin_deleteParam(p) {
  try {
    const id = String(p.id || '').trim();
    if (!id) return {success:false, error:'Missing param ID'};

    const sh   = getSheet(SH.PARAMS);
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) {
        if (p.hardDelete) {
          sh.deleteRow(i + 1);
        } else {
          sh.getRange(i+1, 6).setValue('FALSE'); // Mark inactive
        }
        return {success:true};
      }
    }
    return {success:false, error:'Parameter not found'};
  } catch(e) {
    return {success:false, error:e.toString()};
  }
}

/**
 * Reorder params. p.order = [{id:'p1', order:1}, {id:'p2', order:2}, ...]
 */
function admin_reorderParams(p) {
  try {
    let orderArr = p.order || [];
    if (typeof orderArr === 'string') { try { orderArr = JSON.parse(orderArr); } catch(_) { orderArr = []; } }
    const sh   = getSheet(SH.PARAMS);
    const data = sh.getDataRange().getValues();
    const orderMap = {};
    orderArr.forEach(o => { orderMap[String(o.id)] = Number(o.order); });
    for (let i = 1; i < data.length; i++) {
      const pid = String(data[i][0]);
      if (orderMap[pid] !== undefined) {
        sh.getRange(i+1, 7).setValue(orderMap[pid]);
      }
    }
    return {success:true};
  } catch(e) {
    return {success:false, error:e.toString()};
  }
}

// ═══════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════
function login(p) {
  try {
    const ec  = String(p.empCode  || '').trim().toUpperCase();
    const pwd = String(p.password || '');
    if (!ec || !pwd) return {success:false, error:'Employee code and password are required'};

    const users = getSheetData(SH.USERS);
    const u = users.find(r => String(r.EmpCode || '').trim().toUpperCase() === ec);
    if (!u) return {success:false, error:'Employee code not found. Contact admin.'};
    if (!isTruthy(u.Active)) return {success:false, error:'Account inactive. Contact admin.'};

    const storedPwd = String(u.Password || '');
    if (storedPwd !== pwd) return {success:false, error:'Incorrect password'};

    const firstLogin = isTruthy(u.FirstLogin) || storedPwd === DEFAULT_PASSWORD;
    return {success:true, name:String(u.Name), branch:String(u.Branch), empCode:ec, firstLogin};
  } catch(e) {
    return {success:false, error:'Login failed: ' + e.toString()};
  }
}

function validateSession(p) {
  try {
    const ec = String(p.empCode || '').trim().toUpperCase();
    if (!ec) return {success:false};
    const u = getSheetData(SH.USERS).find(r => String(r.EmpCode||'').trim().toUpperCase() === ec);
    if (!u || !isTruthy(u.Active)) return {success:false};
    return {success:true, name:String(u.Name), branch:String(u.Branch)};
  } catch(e) { return {success:false}; }
}

function changePassword(p) {
  try {
    const ec     = String(p.empCode      || '').trim().toUpperCase();
    const oldPwd = String(p.oldPassword  || '');
    const newPwd = String(p.newPassword  || '');
    if (!ec || !oldPwd || !newPwd) return {success:false, error:'All fields required'};
    if (newPwd === DEFAULT_PASSWORD)   return {success:false, error:'New password cannot be the default password'};
    if (newPwd.length < 6)             return {success:false, error:'Password must be at least 6 characters'};

    const sh   = getSheet(SH.USERS);
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]||'').trim().toUpperCase() === ec) {
        if (String(data[i][3]) !== oldPwd) return {success:false, error:'Current password is incorrect'};
        sh.getRange(i+1, 4).setValue(newPwd);
        sh.getRange(i+1, 5).setValue('FALSE');
        return {success:true};
      }
    }
    return {success:false, error:'User not found'};
  } catch(e) { return {success:false, error:e.toString()}; }
}

// ═══════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════
function markAttendance(p) {
  try {
    const ec     = String(p.empCode || '').trim().toUpperCase();
    const date   = String(p.date   || '').substring(0,10);
    const status = String(p.status || '');
    if (!ec || !date || !status) return {success:false, error:'Missing required data'};

    const exists = getSheetData(SH.ATTENDANCE).some(r =>
      String(r.EmpCode||'').trim().toUpperCase() === ec &&
      String(r.Date||'').substring(0,10) === date
    );
    if (exists) return {success:false, error:'Attendance already marked for today'};

    getSheet(SH.ATTENDANCE).appendRow([date, ec, String(p.branch||''), String(p.name||''), status, now()]);
    return {success:true};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function getAttendance(p) {
  try {
    const ec   = String(p.empCode || '').trim().toUpperCase();
    const date = String(p.date   || '').substring(0,10);
    if (!ec || !date) return {success:false, error:'Missing data'};

    const rec = getSheetData(SH.ATTENDANCE).find(r =>
      String(r.EmpCode||'').trim().toUpperCase() === ec &&
      String(r.Date||'').substring(0,10) === date
    );
    return rec
      ? {success:true, status:String(rec.Status), timestamp:String(rec.Timestamp||'')}
      : {success:true, status:null};
  } catch(e) { return {success:false, error:e.toString()}; }
}

// ═══════════════════════════════════════
//  SERVICE REPORT  (JSON-based, param-agnostic)
// ═══════════════════════════════════════
function submitReport(p) {
  try {
    const ec   = String(p.empCode || '').trim().toUpperCase();
    const date = String(p.date   || '').substring(0,10);
    if (!ec || !date) return {success:false, error:'Missing data'};

    const att = getSheetData(SH.ATTENDANCE).find(r =>
      String(r.EmpCode||'').trim().toUpperCase() === ec &&
      String(r.Date||'').substring(0,10) === date
    );
    if (!att || att.Status !== 'Present')
      return {success:false, error:'Must be marked Present to submit a report'};

    const dup = getSheetData(SH.REPORTS).some(r =>
      String(r.EmpCode||'').trim().toUpperCase() === ec &&
      String(r.Date||'').substring(0,10) === date
    );
    if (dup) return {success:false, error:'Report already submitted for today'};

    let vals = p.values || {};
    if (typeof vals === 'string') { try { vals = JSON.parse(vals); } catch(_) { vals = {}; } }

    // Store params as JSON blob — completely param-agnostic
    const row = [
      date, ec, String(p.branch||''), String(p.name||''),
      JSON.stringify(vals),
      Number(p.score)||0,
      now()
    ];
    getSheet(SH.REPORTS).appendRow(row);
    return {success:true};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function getReport(p) {
  try {
    const ec   = String(p.empCode || '').trim().toUpperCase();
    const date = String(p.date   || '').substring(0,10);
    if (!ec || !date) return {success:false, error:'Missing data'};
    const rec = getSheetData(SH.REPORTS).find(r =>
      String(r.EmpCode||'').trim().toUpperCase() === ec &&
      String(r.Date||'').substring(0,10) === date
    );
    if (!rec) return {success:true, submitted:false};
    let vals = {};
    try { vals = JSON.parse(String(rec.Params_JSON || '{}')); } catch(_) {}
    return {success:true, submitted:true, score:Number(rec.Score)||0, values:vals};
  } catch(e) { return {success:false, error:e.toString()}; }
}

// ═══════════════════════════════════════
//  BUDGET  (JSON-based)
// ═══════════════════════════════════════
function getBudget(p) {
  try {
    const branch = String(p.branch || '');
    const month  = String(p.month  || '').substring(0,7);
    if (!branch || !month) return {success:true, budget:{}};
    const rec = getSheetData(SH.BUDGET).find(r =>
      String(r.Branch||'') === branch && String(r.Month||'').substring(0,7) === month
    );
    if (!rec) return {success:true, budget:{}};
    let budget = {};
    try { budget = JSON.parse(String(rec.Params_JSON || '{}')); } catch(_) {}
    return {success:true, budget};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function getMasterData() {
  try {
    const rows = getSheetData(SH.MASTER);
    return {success:true, data:rows.map(r => ({
      branch:  String(r.Branch  || ''),
      name:    String(r.Name    || ''),
      empCode: String(r.EmpCode || '')
    }))};
  } catch(e) { return {success:false, error:e.toString()}; }
}

// ═══════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════
function parseReportValues(rec) {
  let vals = {};
  // Support both old-style individual columns and new JSON blob
  if (rec.Params_JSON !== undefined) {
    try { vals = JSON.parse(String(rec.Params_JSON || '{}')); } catch(_) {}
  } else {
    // Legacy: p1..p16 columns
    for (let i = 1; i <= 20; i++) {
      const k = 'p' + i;
      if (rec[k] !== undefined) vals[k] = Number(rec[k]) || 0;
    }
  }
  return vals;
}

function admin_getDashboard(p) {
  try {
    const date = String(p.date || '').substring(0,10);
    const att    = getSheetData(SH.ATTENDANCE).filter(r => String(r.Date||'').substring(0,10) === date);
    const reps   = getSheetData(SH.REPORTS).filter(r => String(r.Date||'').substring(0,10) === date);
    const master = getSheetData(SH.MASTER);
    return {success:true,
      attendance: att.map(r => ({empCode:r.EmpCode, name:r.Name, branch:r.Branch, status:r.Status, timestamp:r.Timestamp})),
      reports:    reps.map(r => ({
        empCode:r.EmpCode, name:r.Name, branch:r.Branch,
        score:Number(r.Score)||0,
        values: parseReportValues(r)
      })),
      master: master.map(r => ({branch:r.Branch, name:r.Name, empCode:r.EmpCode}))
    };
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_getAttendance(p) {
  try {
    const date = String(p.date || '').substring(0,10);
    if (!date) return {success:false, error:'Missing date'};
    const rows = getSheetData(SH.ATTENDANCE).filter(r => String(r.Date||'').substring(0,10) === date);
    return {success:true, data:rows.map(r => ({
      empCode:r.EmpCode, name:r.Name, branch:r.Branch, status:r.Status, timestamp:r.Timestamp
    }))};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_getReports(p) {
  try {
    const mode  = String(p.mode  || 'daily');
    const date  = String(p.date  || '').substring(0,10);
    const month = String(p.month || '').substring(0,7);
    let rows = getSheetData(SH.REPORTS);
    if (mode === 'daily'   && date)  rows = rows.filter(r => String(r.Date||'').substring(0,10) === date);
    if (mode === 'monthly' && month) rows = rows.filter(r => String(r.Date||'').substring(0,7)  === month);

    if (mode === 'monthly') {
      const agg = {};
      rows.forEach(r => {
        const k = String(r.EmpCode||'').trim().toUpperCase();
        if (!agg[k]) agg[k] = {empCode:r.EmpCode, name:r.Name, branch:r.Branch, score:0, reportDays:0, values:{}};
        const vals = parseReportValues(r);
        agg[k].score += Number(r.Score)||0;
        agg[k].reportDays++;
        Object.keys(vals).forEach(id => {
          agg[k].values[id] = (agg[k].values[id]||0) + (Number(vals[id])||0);
        });
      });
      return {success:true, data:Object.values(agg)};
    }
    return {success:true, data:rows.map(r => ({
      empCode:r.EmpCode, name:r.Name, branch:r.Branch,
      score:Number(r.Score)||0,
      values: parseReportValues(r)
    }))};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_getMasterData() { return getMasterData(); }

function admin_addBranch(p) {
  try {
    const branch  = String(p.branch  || '').trim();
    const name    = String(p.name    || '').trim();
    const empCode = String(p.empCode || '').trim().toUpperCase();
    if (!branch || !name || !empCode) return {success:false, error:'All fields required'};
    const dup = getSheetData(SH.MASTER).some(r => String(r.EmpCode||'').trim().toUpperCase() === empCode);
    if (dup) return {success:false, error:'Employee code already exists'};
    getSheet(SH.MASTER).appendRow([branch, name, empCode]);
    getSheet(SH.USERS).appendRow([empCode, branch, name, DEFAULT_PASSWORD, 'TRUE', 'TRUE']);
    return {success:true};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_removeBranch(p) {
  try {
    const ec = String(p.empCode || '').trim().toUpperCase();
    if (!ec) return {success:false, error:'Missing empCode'};
    const mSh = getSheet(SH.MASTER);
    const mData = mSh.getDataRange().getValues();
    for (let i=1; i<mData.length; i++) {
      if (String(mData[i][2]||'').trim().toUpperCase() === ec) { mSh.deleteRow(i+1); break; }
    }
    const uSh = getSheet(SH.USERS);
    const uData = uSh.getDataRange().getValues();
    for (let i=1; i<uData.length; i++) {
      if (String(uData[i][0]||'').trim().toUpperCase() === ec) { uSh.getRange(i+1,6).setValue('FALSE'); break; }
    }
    return {success:true};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_getBudgets(p) {
  try {
    const month = String(p.month || '').substring(0,7);
    if (!month) return {success:true, data:{}};
    const rows = getSheetData(SH.BUDGET).filter(r => String(r.Month||'').substring(0,7) === month);
    const data = {};
    rows.forEach(r => {
      let bud = {};
      try { bud = JSON.parse(String(r.Params_JSON || '{}')); } catch(_) {}
      data[String(r.Branch||'')] = bud;
    });
    return {success:true, data};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_saveBudget1(p) {
  try {
    const branch = String(p.branch || '').trim();
    const month  = String(p.month  || '').substring(0,7);
    if (!branch || !month) return {success:false, error:'Missing branch or month'};

    let vals = p.vals || {};
    if (typeof vals === 'string') { try { vals = JSON.parse(vals); } catch(_) { vals = {}; } }

    const sh = getSheet(SH.BUDGET);
    const data = sh.getDataRange().getValues();
    let rowIdx = -1;
    for (let i=1; i<data.length; i++) {
      if (String(data[i][0]||'') === branch && String(data[i][1]||'').substring(0,7) === month) {
        rowIdx = i+1; break;
      }
    }
    const rowArr = [branch, month, JSON.stringify(vals)];
    if (rowIdx > 0) sh.getRange(rowIdx, 1, 1, rowArr.length).setValues([rowArr]);
    else sh.appendRow(rowArr);
    return {success:true};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_getHolidays() {
  try {
    const rows = getSheetData(SH.HOLIDAYS);
    return {success:true, data:rows.map(r => ({date:String(r.Date||''), desc:String(r.Description||'')}))};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_addHoliday(p) {
  try {
    const date = String(p.date || '').substring(0,10);
    const desc = String(p.desc || '').trim();
    if (!date || !desc) return {success:false, error:'Date and description required'};
    const dup = getSheetData(SH.HOLIDAYS).some(r => String(r.Date||'').substring(0,10) === date);
    if (dup) return {success:false, error:'Holiday already exists for this date'};
    getSheet(SH.HOLIDAYS).appendRow([date, desc]);
    return {success:true};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_removeHoliday(p) {
  try {
    const date = String(p.date || '').substring(0,10);
    const sh = getSheet(SH.HOLIDAYS);
    const data = sh.getDataRange().getValues();
    for (let i=1; i<data.length; i++) {
      if (String(data[i][0]||'').substring(0,10) === date) { sh.deleteRow(i+1); return {success:true}; }
    }
    return {success:false, error:'Holiday not found'};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_getEfficiency(p) {
  try {
    const month = String(p.month || '').substring(0,7);
    const res = admin_getReports({mode:'monthly', month});
    // Rename 'values' to 'paramTotals' for efficiency view compatibility
    const data = (res.data||[]).map(u => ({
      ...u,
      totalScore: u.score,
      paramTotals: u.values
    }));
    return {success:true, data};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_getUsers() {
  try {
    const rows = getSheetData(SH.USERS).filter(r => isTruthy(r.Active));
    return {success:true, data:rows.map(r => ({
      empCode:    String(r.EmpCode    || ''),
      name:       String(r.Name       || ''),
      branch:     String(r.Branch     || ''),
      firstLogin: isTruthy(r.FirstLogin)
    }))};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function admin_resetPassword(p) {
  try {
    const ec  = String(p.empCode     || '').trim().toUpperCase();
    const pwd = String(p.newPassword || DEFAULT_PASSWORD);
    if (!ec) return {success:false, error:'Missing empCode'};
    const sh = getSheet(SH.USERS);
    const data = sh.getDataRange().getValues();
    for (let i=1; i<data.length; i++) {
      if (String(data[i][0]||'').trim().toUpperCase() === ec) {
        sh.getRange(i+1, 4).setValue(pwd);
        sh.getRange(i+1, 5).setValue('TRUE');
        return {success:true};
      }
    }
    return {success:false, error:'User not found'};
  } catch(e) { return {success:false, error:e.toString()}; }
}

// ═══════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════
function setupSheets() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const created = [], existing = [];
    Object.values(SH).forEach(name => {
      if (ss.getSheetByName(name)) { existing.push(name); }
      else { const sh = ss.insertSheet(name); seedSheet(sh, name); created.push(name); }
    });
    return {success:true, created, existing,
      message:'Created: [' + created.join(', ') + ']. Already existed: [' + existing.join(', ') + ']'};
  } catch(e) { return {success:false, error:e.toString()}; }
}

function initialSetup() {
  const r = setupSheets();
  Logger.log(JSON.stringify(r));
  return r;
}
