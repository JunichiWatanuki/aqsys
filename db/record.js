//
//
// 記録データベース CRUD
//
//
const Decimal = require('decimal');
const knex = require('./knex'); // the connection!
const table = 'record';
var config = {
  schemaname: 'aqsyssample',
  basedate: '2017/12/31'
};

// console.log("db/record.js begin");

module.exports = {
  getAll(tNum) {
    return( knex.withSchema(config.schemaname).from(table+tNum).whereNull('disabled').orWhere('disabled',false));
  },
  getOne(tNum,rid) {
    return( knex.withSchema(config.schemaname).from(table+tNum).where('rid', rid).whereNull('disabled').orWhere('disabled', false).first());
  },
  create(tNum,row) {
//    console.log("create");
    return knex.withSchema(config.schemaname).from(table+tNum).insert(row, '*');
  },
  update(tNum,rid,row) {
//    console.log("update");
//    console.log(tNum);
//    console.log(rid);
//    console.log(row);
    return knex.withSchema(config.schemaname).from(table+tNum).where('rid', rid).update(row, '*');
  },
  delete(iNum,rid) {
    return knex.withSchema(config.schemaname).from(table+tNum).where('rid', rid).del();
  },
  setConfig(argconfig) {
    config = argconfig;
  } ,
  decodeRow,
  encodeRow,
  calcTime,
  diffTime,
  addTime,
  formTime,
  reformTime,
  encodeTime,
  decodeRacenum,
  encodeRacenum
};

function decodeRow(row) {
  if(row.disabled) {
    row.ftime="";
  }else{
    row.ftime=reformTime(row.ftime);
  }
  row.racenum = decodeRacenum(row.racenum);
}

function encodeRow(row) {
  if(row.ftime=="") {
    delete row.ftime;
    row.disabled = true;
  }else{
    row.ftime = reformTime(row.ftime);
  }
  if(row.racenum != undefined ) {
    row.racenum = encodeRacenum(row.racenum);
  }
  return true;
}

function calcTime(fromTime, toTime) {
    var fromTimeSplit = (fromTime+"").split(/[:.]/);
    var toTimeSplit = (toTime+"").split(/[:.]/);
    return(
      (toTimeSplit[0]||0)*100*60*60+
      (toTimeSplit[1]||0)*100*60+
      (toTimeSplit[2]||0)*100+
      (toTimeSplit[3]||0)*1-
      (fromTimeSplit[0]||0)*100*60*60-
      (fromTimeSplit[1]||0)*100*60-
      (fromTimeSplit[2]||0)*100-
      (fromTimeSplit[3]||0)*1
    );
}

function diffTime(fromTime, toTime) {
    return(formTime(calcTime(fromTime,toTime)));
}

function addTime(fromTime, toTime) {
  var fromTimeSplit = (fromTime+"").split(/[:.]/);
  var toTimeSplit = (toTime+"").split(/[:.]/);
  var milisec =
    (fromTimeSplit[0]||0)*100*60*60+
    (fromTimeSplit[1]||0)*100*60+
    (fromTimeSplit[2]||0)*100+
    (fromTimeSplit[3]||0)*1+
    (toTimeSplit[0]||0)*100*60*60+
    (toTimeSplit[1]||0)*100*60+
    (toTimeSplit[2]||0)*100+
    (toTimeSplit[3]||0)*1;
    return(formTime(milisec));
}

function formTime(ms) {
    var milisec=new Decimal(ms);
    return(
      ("00"+parseInt(milisec.div(60*60*100),0)%24).slice(-2)+":"+
      ("00"+parseInt(milisec.div(60*100),0)%60).slice(-2)+":"+
      ("00"+parseInt(milisec.div(100),0)%60).slice(-2)+"."+
      ("00"+parseInt(milisec%100,0)).slice(-2)
    );
}

function reformTime(ft) {
  if(ft){
    var ftime=ft.split(/[-:]/).reverse();
    var sec=parseInt(ftime[0]||0);
    var milisec=parseInt(Decimal.mul(ftime[0]||0,100)-sec*100);
    return(
      ("00"+(ftime[2]||0)).slice(-2)+":"+
      ("00"+(ftime[1]||0)).slice(-2)+":"+
      ("00"+(sec||0)).slice(-2)+"."+
      ("00"+(parseInt((milisec||0),0))).slice(-2)
    );
  } else {
    return(ft);
  }
}

function encodeTime(time) {
  return(
    ("0000"+(time.getFullYear()||0)).slice(-4)+"/"+
    ("00" + (time.getMonth()+1)).slice(-2)+"/"+
    ("00" + (time.getDate()||0)).slice(-2)+" "+
    ("00" + (time.getHours()||0)).slice(-2)+":"+
    ("00" + (time.getMinutes()||0)).slice(-2)+":"+
    ("00" + (time.getSeconds()||0)).slice(-2)+"."+
    ("00" + (time.getTime()||0)).slice(-2)
  );
}

function decodeRacenum(racenum) {
  if( racenum == null ) {
    return(null);
  }else if( racenum!="" && racenum>=0){
    return(("000"+racenum).slice(-3));
  }else{
    return("");
  }
}


function encodeRacenum(racenum) {
  if(racenum == null) {
    return(null);
  }else if(racenum != null && racenum!="" && racenum>=0){
    return(("000"+racenum).slice(-3));
  }else{
    return(-1);
  }
}

//console.log("db/record.js end");
