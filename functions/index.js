const functions = require('firebase-functions');
const express = require('express');

const app = express();
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var moment = require('moment');
var dateFormat = require('dateformat');

const keySecret = 'sk_test_uTruc1s8uAyh0SAfKUmmYVJ200gfRfONpB';

const stripe = require("stripe")(keySecret);


var smtpTransport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'squidtestuser2019',

        pass: 'SquidTest2019'
    }
});
var cors = require('cors');
var serviceAccount = require('./squiddummy-73c9b-firebase-adminsdk-sfege-8853cd486a.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), // Or credential
    databaseURL: "https://squiddummy-73c9b.firebaseio.com"
});
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}))
database = admin.database();
userref = database.ref("Users"); //ref for Users child
redeemref = database.ref("Redemptions"); // ref for Redemptions child
purchaseref = database.ref("Purchases"); // ref for Purchases child
storeInteractionref = database.ref("Store Interaction Data"); // Store interaction
storeloginref = database.ref("Store Login"); // Store login
addcustomerref = database.ref("Add Customer");
superAdminref = database.ref("Super Admin");


app.all("/*", (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    next();
});


//**************************testing api's **************************************
app.get('/timestamp', (request, response) => {
    response.send(`${Date.now()}`);
});
app.get('/tayyab', (req, res) => {
    return smtpTransport.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.send({ data: error.message });
        }
        return res.send({ data: info.response });
    })
});
//***********************stripe payment gateway***********************************
app.post('/stripe', (req, res) => {
    var token = req.body.token_id;

    stripe.charges.create({
        amount: 100,
        currency: "INR",
        description: "Example charge",
        source: token
    }, (err, charge) => {
        console.log('charge');
        if (err) {
            res.send({ success: false, message: err });
        } else {
            res.send({ success: true, message: 'success' });
        }
    })
});
//***********************Add admin*************************************************

// app.post('/addAdmin',(req, res) => {
// return new Promise(function(resolve, reject){
// superAdminref.push().set({
// Username: "squidtestuser2019@gmail.com",
// Password: "squidtest2020"
// });
// }).then(function(value){
// return res.send({data: value});
// }) 
// });

//**************************Admin Login********************************************
app.post('/SuperAdminLogin', (req, res) => {
    superAdminref.once('value', (snapshot) => {
        res.send({ data: snapshot.val() });
    })
});

//******************************add new purchase ***********************************
// app.post('/addnewPurchase', (req, res) => {
//     var obj = {
//         Date: "15/03/2020",
//         Day: "Sunday",
//         Device: "Android",
//         Offline: "false",
//         TagID: "N0CZPOOXIR9IOAI7",
//         Time: "1:58",
//         Timestamp: "1584217728"
//     }
//     purchaseref.child('Testing5/TT005/-M2h-ega_AuKfV9iz5xW').push(obj)
// });
//*****************************Add new cusotmer*************************************
app.post('/addnewcustomer', (req, res) => {

    // res.send({data: req.body.business_name});
    var business_name = req.body.business_name;
    var store_code = req.body.store_code;
    var contact_name = req.body.contact_name;
    var contact_email = req.body.contact_email;
    var free_trial_end_date = req.body.dp.day + "-" + req.body.dp.month + "-" + req.body.dp.year;
    var randomPassword = (Math.random() * 1e32).toString(36);
    var mailOptions = {
        from: 'squidtestuser2019@gmail.com',
        to: contact_email,
        subject: 'Test',
        text: 'To the concerned, this is your temporary password to enter squid reward.Use it with the registered email address' + randomPassword
    };

    return new Promise((resolve, reject) => {
            storeloginref.push().set({

                Business_Name: business_name,
                Store_Code: store_code,
                Contact_Name: contact_name,
                Contact_Email: contact_email,
                Free_Trial_End_Date: free_trial_end_date,
                Status: '0',
                Password: randomPassword

            })
            resolve('Success!');
        })
        .then((value) => {
            return smtpTransport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.send({ data: error.message });
                }
                return res.send({ data: "successfully implemented" });
                // return info;
                // return res.send({data: info.response});
            });
        });


});

//****************************store login*****************************************

app.post('/checkUser', (req, res) => {
    var arr = {};
    var arr1 = {};
    var arr2 = {};
    var arr3 = {};
    var reqObj = req;
    console.log(req.body);

    var username = req.body;
    var user = "tayyabjohar@gmail.com";


    superAdminref.orderByChild("Username").equalTo(username.email).once('value', (snapshot) => {
        if (snapshot.exists()) {
            arr = Object.values(snapshot.val());

            arr1 = arr;

            if (arr1[0].Password === username.password) {
                return res.send({ status: "true", type: "Admin", data: snapshot.val() });
            } else {
                return res.send({ message: "Authentication Failed" });
            }
            // console.log(arr1['Store Name']);
            // return res.send(arr1[0].Password);

        } else {
            storeloginref.orderByChild("Contact_Email").equalTo(username.email).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    arr2 = Object.values(snapshot.val());

                    arr3 = arr2;
                    if (arr3[0].Password === username.password) {
                        return res.send({ status: "true", type: "Customer", data: snapshot.val() });
                        // return res.send({ status: "true",type: "Admin", data: snapshot.val() });
                    } else {
                        return res.send({ message: "Authentication Failed" });
                    }

                    // console.log(arr1['Store Name']);


                } else {
                    console.log("doesn't exist");
                    return res.send({ message: "Authentication Failed" });

                }
            });
        }
    });


});

//****************************api for first time reset password********************************

app.post('/changefirstPassword', (req, res) => {
    var reqObj = req.body;

    storeloginref.orderByChild("Contact_Email").equalTo(reqObj.email).once('value', (snapshot) => {
        if (snapshot.exists()) {
            var arr = snapshot.val();
            storeloginref.child(reqObj.key).update({ 'Password': reqObj.password, 'Status': '1' })
            return res.send({ message: 'Password changed successfully' });
        } else {
            console.log("doesn't exist");
            return res.send({ message: "Authentication Failed" });

        }
    });
});

//******************************getTotalCustomer************************************************
app.get('/getTotalCustomer', (req, res) => {
    storeloginref.once("value", (snapshot) => {
        // console.log(snapshot.val().length);
        return res.send({ message: "done", data: snapshot.val() });
    });
});
//*************************************************************************
app.post('/getTimestamp', (req, res) => {
    var storeReq = req.body.store;
    var arr = [];
    var promise = purchaseref.child(storeReq).once('value', function(snapshot) {

        if (snapshot) {
            return callback(snapshot, res);
        }
    });

});


function callback(snapshot, res) {
    var dt = moment().subtract(7, 'days').calendar();
    dt = dateFormat(dt, "yyyy-mm-dd");
    newdt = Math.floor((new Date(dt)).getTime() / 1000);
    var arr = [];
    var abc = [];
    var array1 = [];
    var array2 = [];
    var ss = {};
    var count = 0;
    array1 = snapshot.val();
    // console.log(array1['6TmVdTUdoS86zbJUkBaOA5Z88bP'])
    arr = Object.values(snapshot.val());
    ss = snapshot.val();
    // console.log(ss);
    for (let i = 0; i < arr.length; i++) {

        array1 = Object.values(arr[i]);
        for (let k = 0; k < array1.length; k++) {

            array2 = array1[k];
            console.log(array2.TimeStamp)
            if (array2.TimeStamp > newdt) {
                count = count + 1;
            } else {
                // console.log("tayyab")
            }

        }

    }

    // console.log(count);

    return res.send({ message: "Stamps collected in last 7 days", result: count });
}

//***********************change trial date***********************************

app.post('/changeTrialDate', (req, res) => {
    // var reqObj = req.body;
    var trial_date = req.body.data;
    var trial_date1 = trial_date.updatedDate.day + "-" + trial_date.updatedDate.month + "-" + trial_date.updatedDate.year;
    // var trial_date = req.body.updatedDate.day + "-" + req.body.updatedDate.month + "-" + req.body.updatedDate.year;
    storeloginref.orderByChild("Contact_Email").equalTo(req.body.clientmail).once('value', (snapshot) => {
        if (snapshot.exists) {


            storeloginref.child(Object.keys(snapshot.val())[0]).update({ 'Free_Trial_End_Date': trial_date1 })
            return res.send({ message: "Trial date changed successfully" });
        } else {
            return res.send({ message: "Something went wrong" });
        }
    });
});
//*****************************getRewardsRedeemedbyTime****************************
app.post('/getRewardsRedeemedbyTime', (req, res) => {

    let promise = new Promise((resolve, reject) => {
        try {
            return redeemref.child('McDonalds/MD-001').once('value', (snapshot) => {
                var data = [];
                var arr = [];
                var arr1 = [];
                var arr2 = [];
                var count1 = 0;
                var count2 = 0;
                var count3 = 0;
                var count4 = 0;
                var count5 = 0;
                arr = Object.values(snapshot.val());
                for (let i = 0; i < arr.length; i++) {
                    // console.log(arr[i]);
                    arr1 = Object.values(arr[i]);
                    // console.log(arr1[i])
                    arr2 = arr1[i];
                    console.log(arr2['TimeStamp']);
                    if (arr2['TimeStamp'] >= interval1 && arr2['TimeStamp'] <= interval2) {
                        var time = getHours(arr2['TimeStamp']);

                        if (time >= 9 && time <= 12) {

                            count1 = count1 + 1;
                            data.push({
                                time: count1
                            });
                        } else if (time >= 12 && time <= 15) {

                            count2 = count2 + 1;
                            data.push({
                                time: count2
                            });
                        } else if (time >= 15 && time <= 18) {

                            count3 = count3 + 1;
                            data.push({
                                time: count3
                            });
                        } else if (time >= 18 && time <= 21) {

                            count4 = count4 + 1;
                            data.push({
                                time: count4
                            });
                        } else if (time >= 21 && time <= 24) {

                            count5 = count5 + 1;
                            data.push({
                                time: count5
                            });
                        }

                    } else {
                        console.log("sfsdf");
                    }



                }
                // var hr = s.getHours();
                // console.log(hr);


                resolve(data);
            }).then((result) => {
                return res.send({ message: "Okay", data: result });
            });

        } catch (e) {
            reject(e);
        }


    })
});


// *****************************************************get new customer *******************************************
// app.post('/', (req, res) => {

// });



//******************************************************************************************************************
app.get('/getNewCustomersAndUnredeemed', (req, res) => {

    console.log("tayyab1");
    // return res.send("dsad");
    var result = [];


    const runAsyncFunctions = async() => {
        // var promise1 = last7dayscustomer();
        // var promise2 = last7daysstamp();
        // var promise3 = unredeemvouchers();
        const [result1, result2] = await Promise.all(
            [last7dayscustomer(),
                last7daysstamp(),
                unredeemvouchers()
            ]
        )
    }

    return runAsyncFunctions().then(results => {
            return res.send({ message: "sdfs" })
        })
        // return Promise.all([promise1,promise2,promise3])
        // .then(results => {
        // result = Object.values(results);
        // console.log(typeof(results));
        // return res.send({ message: "okay", data: results });
        // });
});

//************************************************

app.post('/customersLast7Days', (req, res) => {
    var storeReq = req.body.store;
    console.log("tayyab");
    // return true;
    var arr = [];
    var array1 = [];
    var array2 = [];
    var count = 0;
    var countArray = [];
    var countfinal = 0;
    var dt = moment().subtract(7, 'days').calendar();
    dt = dateFormat(dt, "yyyy-mm-dd");
    newdt = Math.floor((new Date(dt)).getTime() / 1000)
    console.log("sahi samay aa gaya haui", dt)
    console.log("abey ghade", newdt)

    return purchaseref.child(storeReq).once('value', (snapshot) => {


        if (snapshot.exists()) {
            arr = Object.values(snapshot.val());
            console.log(arr);
            for (let i = 0; i < arr.length; i++) {
                array1 = Object.values(arr[i]);

                for (let k = 0; k < array1.length; k++) {
                    array2 = array1[k];
                    console.log("debug1", array2.TimeStamp)
                    console.log("debug", array2.TimeStamp > newdt)
                    if (array2.TimeStamp > newdt) {

                        count = count + 1;
                        console.log("condition", count)
                    } else {

                        console.log("gha");
                    }

                }

                countArray.push(count);

            }
            console.log("countArray", countArray.length);
            for (j = 0; j < countArray.length; j++) {
                if (countArray[j] > 0) {
                    countfinal = countfinal + 1;
                } else {
                    console.log("dhsj");
                }
            }

        } else {
            return res.send({ data: 0 });

        }

        console.log(countfinal);
        // return res.send({message: "success",data: resolve(countfinal)});
    }).then(() => {
        return res.send({ message: "sfsf", data: countfinal })
    })




});






// function last7daysstamp() {
// var dt = moment().subtract(60, 'days').calendar();
// dt = dateFormat(dt, "yyyy-mm-dd");
// newdt = Math.floor(new Date(dt).getTime());
// var arr = [];
// var abc = [];
// var array1 = [];
// var array2 = [];
// var ss = {};
// var count = 0;

// return new Promise((resolve, reject) => {
// try {
// purchaseref.child('Krispy Kreme/KK-001').once('value', function(snapshot) {
// arr = Object.values(snapshot.val());
// console.log(arr);
// for (let i = 0; i < arr.length; i++) {
// array1 = Object.values(arr[i]);

// for (let k = 0; k < array1.length; k++) {
// array2 = array1[k];

// if (array2['TimeStamp'] > newdt) {
// count = count + 1;
// } else {
// console.log("fsdf");
// }

// }
// }

// console.log(countfinal);
// return resolve(count);
// });

// } catch (e) {
// return reject(e);
// }

// });


// }


// function unredeemvouchers() {
// var unredeemed1 = [];
// var unredeemed2 = [];
// var unredeemed3 = [];
// var unredeemedtotal = 0;

// return new Promise((resolve, reject) => {

// try {
// storeInteractionref.child('Krispy Kreme').once('value', function(snapshot1) {
// console.log(snapshot.val());
// unredeemed1 = Object.values(snapshot1.val());
// console.log(arr);

// for (let i = 0; i < unredeemed1.length; i++) {

// unredeemed2 = unredeemed1[i];
// unredeemedtotal = unredeemedtotal + (unredeemed2['Vouchers Earned'] - unredeemed2['Vouchers Redeemed']);
// }
// return resolve(unredeemedtotal);
// return unredeemedtotal;
// });

// } catch (e) {
// return reject(e);
// }

// });

// }
//**********************api for unredeemed vouchers on current day****************************************************
app.post('/unreedemed', (req, res) => {
    var storeReq = req.body.store;
    var dt = moment().subtract(7, 'days').calendar();
    dt = dateFormat(dt, "yyyy-mm-dd");
    newdt = Math.floor(new Date(dt).getTime());

    storeInteractionref.child(storeReq).once('value', (snapshot) => {

        if (snapshot.exists()) {
            console.log(snapshot.val());
            let arr = snapshot.val();
            let arr2 = arr['Vouchers Earned'] - arr['Vouchers Redeemed'];
            res.send({ message: "unredeemed vouchers", data: arr2 });
        } else {
            res.send({ data: 0 })
        }


    })
});


//******************************total user breakdown on the basis of gender******************************************************
app.get('/totaluserbreakdown', (req, res) => {

    console.log("calling api");

    var arr = [];
    var male = 0;
    var female = 0;
    var other = 0;
    var unknown = 0;

    userref.once('value', function(snapshot) {
        var total_count = 0;

        if (snapshot) {
            var myData = Object.keys(snapshot.val()).map(key => {
                return snapshot.val()[key];
            })

            for (var i = 0; i < myData.length; i++) {
                var gender = myData[i].Gender;

                //  console.log(gender);
                if (gender === "male" || gender === "Male") {
                    male = male + 1;
                } else if (gender === "female" || gender === "Female") {
                    female = female + 1;
                } else if (gender === "other" || gender === "Other") {
                    other = other + 1;
                } else {
                    unknown = unknown + 1;
                }

            }
            // console.log(myData);
        }

        total_count = male + female + other;
        male_percentage = (male / total_count) * 100;
        male_percentage = male_percentage.toFixed(2);

        female_percentage = (female / total_count) * 100;
        female_percentage = female_percentage.toFixed(2);

        others_percentage = (other / total_count) * 100;
        others_percentage = others_percentage.toFixed(2);

        res.send({ message: "Gender Counts", "male": male, "female": female, "other": other, "unknown": unknown, male_percentage: male_percentage, female_percentage: female_percentage, others_percentage: others_percentage });

    });

});

//***********************api for stamps collected everyday**********************************

//***********************data by day function*******************************************

//*********************************data by week function**********************************





//******************************************************************************************
app.post('/getalluserdata', (req, res) => {
    userref.once("value", (snapshot) => {
        // console.log(snapshot.val().length);
        return res.send({ message: "done", data: snapshot.val() });
    });
});

//**************************************8
app.post('/getLoyaltyStamps', (req, res) => {
    var apitype = req.body.type;
    var date1 = [];
    var count = 0;
    var countArray = [];
    var obj = {};
    var elseArray = [];
    var storeReq = req.body.store;
    var device = [];


    // console.log("$$$ loyalty stamps");
    // if (req.body.store === '' || req.body.store === null || req.body.store === undefined) {
    //     store = "Krispy Kreme/KK-001";
    // } else {
    //     store = req.body.store;
    // }

    return purchaseref.child(storeReq).once('value', (snapshot) => {
        if (snapshot.exists()) {
            let arr = Object.values(snapshot.val())
            for (let i = 0; i < arr.length; i++) {
                var arr3 = Object.values(arr[i]);

                for (let k = 0; k < arr3.length; k++) {
                    var arr4 = arr3[k];

                    var d = arr4.Date;

                    date1.push(d);
                    device.push(arr4.Device);

                }

            }

            console.log("device type ddddttttt")
            console.log(device)


        } else {
            obj = { date: 0, sales2: 0 };
            elseArray.push(obj);
            return res.send(elseArray);
        }


    }).then(() => {

        return callfuction(date1, res, apitype, device);

    })

});

//***************************************8

app.post('/getRewardsRedeemed', (req, res) => {

    // console.log(req.body);
    var apitype = req.body.type;

    var date1 = [];
    var count = 0;
    var countArray = [];
    var elseArray = [];
    var obj = {};
    var storeReq = req.body.store;
    var device = [];


    return redeemref.child(storeReq).once('value', (snapshot) => {
        if (snapshot.exists()) {
            let arr = Object.values(snapshot.val())
            for (let i = 0; i < arr.length; i++) {
                var arr3 = Object.values(arr[i]);

                for (let k = 0; k < arr3.length; k++) {
                    var arr4 = arr3[k];

                    var d = arr4.Date;

                    date1.push(d);
                    device.push(arr4.Device);


                }

            }

        } else {
            obj = { date: 0, sales2: 0 };
            elseArray.push(obj);
            return res.send(elseArray);
        }

    }).then(() => {

        return callfuction(date1, res, apitype, device);

    })

});
//*************************888
function callfuction(date1, res, apitype, device) {
    console.log("shreya")
    var datenew = "";
    var count = 0;
    var countArray = [];
    arrayfinal = [];
    var convertdate = "";
    var values = [];

    for (let i = 0; i < date1.length; i++) {
        // console.log(date1[i])

        if (device[i] === "Android") {
            convertdate = moment(date1[i], 'DD-MMM-YYYY').format("DD/MM/YYYY");

        } else if (device[i] === "iPhone") {
            var ssh = moment(date1[i], 'DD/MM/YYYY');
            convertdate = dateFormat(ssh, "dd/mm/yyyy");

        } else {
            convertdate = moment(date1[i], 'DD/MM/YYYY');
            // var convertdate = new Date( date1[i].getTime() + Math.abs(date1[i].getTimezoneOffset()*60000))
            var month = ((convertdate.month() + 1) < 10 ? '0' : '') +
                (convertdate.month() + 1);

            var year = convertdate.year();
            var day = ((convertdate.date()) < 10 ? '0' : '') +
                (convertdate.date());

            var ndt = [day, month, year].join('/');
            convertdate = ndt;
        }


        var newdata1 = convertdate;

        // console.log(newdata1);
        arrayfinal.push(newdata1);
        // return true;
    }

    var dateData = ["26/06/2016", "04/06/2016", "13/05/2016", "20/07/2016"];

    function dateToNum(d) {

        d = d.split("/");
        return Number(d[2] + d[1] + d[0]);
    }

    arrayfinal.sort(function(a, b) {
        return dateToNum(a) - dateToNum(b);
    })


    if (apitype === 0) {
        //  console.log(arrayfinal);
        //  console.log("tayyab");
        // console.log(arrayfinal[arrayfinal.length - 1])
        for (let k = 0; k < arrayfinal.length + 1; k++) {
            //    console.log("times")
            // console.log(arrayfinal[k])
            if (datenew === "") {
                datenew = arrayfinal[k];
                count = count + 1;
                // var datanew = new Date(datenew);
                // console.log(new Date( datanew.getTime() + Math.abs(datanew.getTimezoneOffset()*60000)));
                // return true;
            } else if (datenew !== "") {
                if (datenew === arrayfinal[k]) {
                    count = count + 1;
                } else {
                    //  console.log("hhas")
                    // console.log(datenew);
                    // var obj = {datenew: count};
                    // countArray.push({ label: datenew, sales2: count });

                    countArray.push({ "label": datenew });
                    values.push({ "value": count });

                    datenew = arrayfinal[k];
                    count = 1;
                }
            }
        }
        //   console.log(countArray)
        res.send({ "label": countArray, "value": values });

    } else if (apitype === 1 || apitype === "1") {
        let startDate = moment(arrayfinal[0], 'DD/MM/YYYY');
        console.log("arrayfinal", arrayfinal)
        console.log("start date", startDate)
        let endDate = moment(arrayfinal[arrayfinal.length - 1], 'DD/MM/YYYY');
        console.log("end date", endDate)
        getDateArray(startDate, endDate, arrayfinal, res);


    } else if (apitype === 2 || apitype === "2") {
        let startDate = moment(arrayfinal[0], 'DD/MM/YYYY');

        let endDate = moment(arrayfinal[arrayfinal.length - 1], 'DD/MM/YYYY');
        getbymonth(startDate, endDate, arrayfinal, res);


    } else if (apitype === 3 || apitype === "3") {
        let startDate = moment(arrayfinal[0], 'DD/MM/YYYY');

        let endDate = moment(arrayfinal[arrayfinal.length - 1], 'DD/MM/YYYY');
        getDateArray1(startDate, endDate, arrayfinal, res);
    } else {
        console.log("sdf");
    }
}
//*********************total user growth*******************
var getDateArray1 = function(start, end, arrayfinal, res) {
        // console.log(start);
        // console.log(end);
        var startDate = moment(start).format('YYYY-MM-DD');
        var endDate = moment(end).format('YYYY-MM-DD');
        console.log("formatted date", startDate)
        finalvalue = [];
        count = 0;
        var listDate = [];
        var array = [];
        var values = [];
        var dateMove = new Date(startDate);
        console.log("dateMove", dateMove)
        var arr = new Array();
        newarr = [];
        iarray = [];
        var datefinal = "";
        // var dt = moment(start);
        console.log("get date array start", start)
        var newobj = {};
        //   dt = moment(dt).format("DD-MM_YYYY")
        // console.log("dt",start <= end)

        // console.log("adding days", moment(start).add(7, 'days'));

        // console.log("ahdhdhdhdh",end < moment(start).add(7, 'days'))
        // if(end < moment(start).add(7, 'days')){

        // for(var a=0; a < arrayfinal.length; a++){

        // }
        // }


        while (startDate < endDate) {
            startDate = dateMove.toISOString().slice(0, 10);
            listDate.push(startDate);
            dateMove.setDate(dateMove.getDate() + 7);
        }
        console.log("list", listDate);
        console.log("arrayfinal", arrayfinal);


        //new one by shreya

        for (let j = 0; j < listDate.length + 1; j++) {
            for (let r = 0; r < arrayfinal.length; r++) {
                // console.log(arrayfinal[r]);
                // console.log(listDate[j]);

                var dta = arrayfinal[r]; //15 
                var dtb = moment(listDate[j]).format('DD/MM/YYYY'); //14

                // var dtc = moment(listDate[j]).subtract(7, 'days');

                var nm = new Date(listDate[j]);
                var dtc = moment(nm.setDate(nm.getDate() - 7)).format('DD/MM/YYYY') //7

                // console.log(dta);
                // console.log(dtb);
                // console.log(moment(dtc.setDate(dtc.getDate() - 7)).format('DD/MM/YYYY'));

                if (dta <= dtb && dta > dtc) {

                    console.log("inside if");

                    count = count + 1;
                    datefinal = listDate[j];

                } else {

                    console.log("inside else");


                    if (count === 0) {
                        console.log("count is zero");
                    } else {
                        console.log(datefinal);
                        console.log(count);

                        // obj = { date: datefinal, sales2: count };
                        // array.push(obj);

                        array.push({ "label": datefinal });
                        values.push({ "value": count });
                        // count = count;
                        datefinal = "";
                    }

                }
            }
        }

        // console.log(arr);
        res.send({ "label": array, "value": values });

        return newarr;
    }
    //**********************************************
var getDateArray = function(start, end, arrayfinal, res) {
    // console.log(start);
    // console.log(end);
    var startDate = moment(start).format('YYYY-MM-DD');
    var endDate = moment(end).format('YYYY-MM-DD');
    console.log("formatted date", startDate)
    finalvalue = [];
    count = 0;
    var listDate = [];
    var array = [];
    var values = [];
    var dateMove = new Date(startDate);
    console.log("dateMove", dateMove)
    var arr = new Array();
    newarr = [];
    iarray = [];
    // var dt = moment(start);
    console.log("get date array start", start)
    var newobj = {};
    //   dt = moment(dt).format("DD-MM_YYYY")
    // console.log("dt",start <= end)

    // console.log("adding days", moment(start).add(7, 'days'));

    // console.log("ahdhdhdhdh",end < moment(start).add(7, 'days'))
    // if(end < moment(start).add(7, 'days')){

    // for(var a=0; a < arrayfinal.length; a++){

    // }
    // }


    while (startDate < endDate) {
        startDate = dateMove.toISOString().slice(0, 10);
        listDate.push(startDate);
        dateMove.setDate(dateMove.getDate() + 7);
    }
    console.log("list", listDate);
    console.log("arrayfinal", arrayfinal);


    //new one by shreya

    for (let j = 0; j < listDate.length + 1; j++) {
        for (let r = 0; r < arrayfinal.length; r++) {
            // console.log(arrayfinal[r]);
            // console.log(listDate[j]);

            var dta = arrayfinal[r]; //15 
            var dtb = moment(listDate[j]).format('DD/MM/YYYY'); //14

            // var dtc = moment(listDate[j]).subtract(7, 'days');

            var nm = new Date(listDate[j]);
            var dtc = moment(nm.setDate(nm.getDate() - 7)).format('DD/MM/YYYY') //7

            // console.log(dta);
            // console.log(dtb);
            // console.log(moment(dtc.setDate(dtc.getDate() - 7)).format('DD/MM/YYYY'));

            if (dta <= dtb && dta > dtc) {

                count = count + 1;
                datefinal = listDate[j];

            } else {
                if (count === 0) {
                    console.log("asd");
                } else {
                    obj = { date: datefinal, sales2: count };

                    array.push({ "label": datefinal });
                    values.push({ "value": count });

                    // array.push(obj);
                    count = 0;
                    datefinal = "";
                }

            }
        }

    }


    return res.send({ "label": array, "value": values });


    //purana

    // while (start <= end) {
    // console.log("lets see if condition is true",start)

    // arr.push(start);
    // start.setDate(start.getDate() + 6);


    // }
    // console.log("hshs",arr)
    // for (var i = 0; i < arr.length; i++) {
    // for (let k = 0; k < arrayfinal.length; k++) {
    // console.log("wedfed", arr[i + 1]);
    // console.log("for week", arrayfinal[k])
    // iarray[i] = moment(arr[i + 1]).format('DD/MM/YYYY');


    // newarr[i] = moment(arr[i]).format('DD/MM/YYYY');

    // console.log(arrayfinal[k + 1], "kkkk");

    // console.log(newarr[i], "cccc");


    // if (arrayfinal[k] >= newarr[i] && arrayfinal[k] < iarray[i]) {
    // count = count + 1;
    // console.log("yyyy");

    // }


    // }
    // finalvalue.push({ date: newarr[i], sales2: count });

    // count = 0; // console.log(newarr[i + 1], "mm");

    // }
    // console.log(arr);
    // res.send(finalvalue);

    // return newarr;
}

var getbymonth = function(startDate, endDate, arrayfinal, res) {

        var start_month;
        var end_month;
        arr = [];

        var st = moment(startDate, 'DD/MM/YYYY');
        start_month = st.month() + 1;
        var month = 0;
        var year;
        var count = 0;
        countarray = [];
        var values = [];
        newarr = [];
        var ndate;
        var nm = 0;
        var nc = 0;
        total_count = 0;
        var et = moment(endDate, 'DD/MM/YYYY');
        end_month = ((et.month() + 1) < 10 ? '0' : '') +
            (et.month() + 1);

        for (var i = 0; i <= arrayfinal.length; i++) {

            var dt = moment(arrayfinal[i], 'DD/MM/YYYY');
            month = dt.month() + 1;
            year = dt.year();

            if (month === start_month) {

                if (i === 0) {
                    for (var j = 0; j < arrayfinal.length; j++) {
                        var nwdt = moment(arrayfinal[j], 'DD/MM/YYYY');
                        nwmonth = nwdt.month() + 1;
                        if (month === nwmonth) {
                            count = count + 1;
                        }
                    }
                    arr.push(month + "/" + year);

                    count = 0;
                }
                count = count + 1;
            } else {
                if (i < arrayfinal.length) {
                    arr.push(month + "/" + year);
                    countarray.push(count);
                } else {
                    countarray.push(count);
                }
                start_month = month;
                count = 1;
            }

        }

        for (let i = 0; i < arr.length; i++) {
            newarr.push({ "label": arr[i] });
            values.push({ "value": countarray[i] });
        }
        res.send({ "label": newarr, "value": values });
        //  console.log(arr);
        // console.log(countarray);
    }
    //********************************************


//****************************************************
app.post('/getstampsbytime', (req, res) => {

    console.log(req.body);

    var arr = [];
    var elseArray = [];
    var obj = {};
    var storeReq = req.body.store;
    // console.log("$$$");
    // if (req.body.store === '' || req.body.store === null || req.body.store === undefined) {
    //     store = "Krispy Kreme/KK-001";
    // } else {
    //     store = req.body.store;
    // }

    var promise = purchaseref.child(storeReq).once('value', function(snapshot) {

        if (snapshot.exists()) {
            console.log(snapshot.val())
            if (req.body.type === 1) {
                stempbytime(snapshot, req, res);
            } else {
                stempbydayname(snapshot, req, res)
            }
        } else {
            if (req.body.type === 1) {
                obj = { date: 0, sales2: 0 };
                elseArray.push(obj);
                return res.send(elseArray);
            } else {
                obj = { date: 0, sales2: 0 };
                elseArray.push(obj);
                return res.send(elseArray);
            }

        }


    });
});
/***************Stamps collected in time interval*********************/

app.post('/getrewardsbytime', (req, res) => {

    console.log(req.body);
    var elseArray = [];
    var arr = [];
    var obj = {};

    var storeReq = req.body.store;
    // console.log("$$$");
    // if (req.body.store === '' || req.body.store === null || req.body.store === undefined) {
    //     store = "McDonalds/MD-001";
    // } else {
    //     store = req.body.store;
    // }

    var promise = redeemref.child(storeReq).once('value', function(snapshot) {

        if (snapshot.exists()) {
            if (req.body.type === 1) {
                stempbytime(snapshot, req, res);
            } else {
                stempbydayname(snapshot, req, res)
            }
        } else {
            obj = { date: 0, sales2: 0 };
            elseArray.push(obj);
            return res.send(elseArray);
        }
    });
});

function stempbytime(snapshot, req, res) {

    // var start = moment().startOf(2011 - 01 - 02);
    // const end = moment().endOf(2011 - 01 - 02);

    var st;
    var ed;
    console.log(req.body.start_dt);
    if (req.body.start_dt === "" || req.body.start_dt === null) {

        st = moment(Date.now() - 7 * 24 * 3600 * 1000).format('YYYY-MM-DD');
    } else {
        st = req.body.start_dt
    }
    if (req.body.end_dt === "" || req.body.end_dt === null) {
        ed = moment(Date.now()).format('YYYY-MM-DD');
    } else {
        ed = req.body.end_dt
    }

    console.log(st, "kkkkkk");
    console.log(ed, "llllll")

    var start = Math.round(new Date(st).getTime());

    var end = new Date(ed);
    end.setHours(23, 59, 59);
    end = end.getTime();

    console.log(start + "******MMMMMMMMMMM******" + end);

    var arr = [];
    var abc = [];
    var array1 = [];
    var array2 = [];
    var ss = {};
    var count = 0;
    var h0 = 0;
    var h1 = 0;
    var h2 = 0;
    var h3 = 0;
    var h4 = 0;
    var h5 = 0,
        h6 = 0,
        h7 = 0,
        h8 = 0,
        h9 = 0,
        h10 = 0,
        h11 = 0,
        h12 = 0,
        h13 = 0,
        h14 = 0,
        h15 = 0,
        h16 = 0,
        h17 = 0,
        h18 = 0,
        h19 = 0,
        h20 = 0,
        h21 = 0,
        h22 = 0,
        h23 = 0;

    array1 = snapshot.val();
    // console.log(array1['6TmVdTUdoS86zbJUkBaOA5Z88bP'])
    arr = Object.values(snapshot.val());
    ss = snapshot.val();

    for (let i = 0; i < arr.length; i++) {
        array1 = Object.values(arr[i]);
        for (let k = 0; k < array1.length; k++) {
            array2 = array1[k];

            dbtimestamp = array2['TimeStamp'];
            var hdh = new Date(dbtimestamp * 1000)

            console.log("gdgdgdgd", hdh.getHours());


            if (start <= dbtimestamp && end >= dbtimestamp) {
                hr = hdh.getHours();

                if (hr === 0) {
                    //     console.log("####333333")

                    h0 = h0 + 1;
                } else if (hr === 1) {
                    h1 = h1 + 1;
                } else if (hr === 2) {
                    h2 = h2 + 1;
                } else if (hr === 3) {
                    h3 = h3 + 1;
                } else if (hr === 4) {
                    h4 = h4 + 1;
                } else if (hr === 5) {
                    h5 = h5 + 1;
                } else if (hr === 6) {
                    h6 = h6 + 1;
                } else if (hr === 7) {
                    h7 = h7 + 1;
                } else if (hr === 8) {
                    h8 = h8 + 1;
                } else if (hr === 9) {
                    h9 = h9 + 1;
                } else if (hr === 10) {
                    h10 = h10 + 1;
                } else if (hr === 11) {
                    h11 = h11 + 1;
                } else if (hr === 12) {
                    h12 = h12 + 1;
                } else if (hr === 13) {
                    h13 = h13 + 1;
                } else if (hr === 14) {
                    h14 = h14 + 1;
                } else if (hr === 15) {
                    h15 = h15 + 1;
                } else if (hr === 16) {
                    h16 = h16 + 1;
                } else if (hr === 17) {
                    h17 = h17 + 1;
                } else if (h18 === 18) {
                    h18 = h18 + 1;
                } else if (hr === 19) {
                    h19 = h19 + 1;
                } else if (hr === 20) {
                    h20 = h20 + 1;
                } else if (hr === 21) {
                    h21 = h21 + 1;
                } else if (hr === 22) {
                    h22 = h22 + 1;
                } else if (hr === 23) {
                    h23 = h23 + 1;
                } else {
                    console.log("aad");
                }

            } else {
                //  console.log("else condition")
            }

        }
    }
    responsearr = [{ date: 0, sales2: h0 }, { date: 1, sales2: h1 }, { date: 2, sales2: h2 }, { date: 3, sales2: h3 }, { date: 4, sales2: h4 }, { date: 5, sales2: h5 }, { date: 6, sales2: h6 }, { date: 7, sales2: h7 }, { date: 8, sales2: h8 }, { date: 9, sales2: h9 }, { date: 10, sales2: h10 }, { date: 11, sales2: h11 }, { date: 12, sales2: h12 }, { date: 13, sales2: h13 }, { date: 14, sales2: h14 }, { date: 15, sales2: h15 }, { date: 16, sales2: h16 }, { date: 17, sales2: h17 }, { date: 18, sales2: h18 }, { date: 19, sales2: h19 }, { date: 20, sales2: h20 }, { date: 21, sales2: h21 }, { date: 22, sales2: h22 }, { date: 23, sales2: h23 }];

    return res.send(responsearr);

}

function stempbydayname(snapshot, req, res) {
    //  console.log("222222")

    // var start = moment().startOf(2011 - 01 - 02);
    // const end = moment().endOf(2011 - 01 - 02);
    console.log("snapshot", snapshot.val())

    var st = req.body.start_dt;
    var ed = req.body.end_dt;

    var start = Math.round(new Date(st).getTime());

    var end = new Date(ed);
    end.setHours(23, 59, 59);
    end = end.getTime();

    // var edt = end.toUTCString();

    console.log(start + "******MMMMMMMMMMM******" + end);

    var arr = [];
    var abc = [];
    var array1 = [];
    var array2 = [];
    var ss = {};
    var count = 0;
    var h1 = 0;
    var h2 = 0;
    var h3 = 0;
    var h4 = 0;
    var h5 = 0;
    var h6 = 0;
    var h7 = 0;


    array1 = snapshot.val();
    console.log("array1", snapshot.val());

    // console.log(array1['6TmVdTUdoS86zbJUkBaOA5Z88bP'])
    arr = Object.values(snapshot.val());
    ss = snapshot.val();
    console.log("arr", arr);
    for (let i = 0; i < arr.length; i++) {
        array1 = Object.values(arr[i]);
        for (let k = 0; k < array1.length; k++) {
            array2 = array1[k];
            console.log("timeStamp", array2['TimeStamp'])
            dbtimestamp = array2['TimeStamp'];
            console.log("dbdbdbdb", dbtimestamp);

            if (start <= dbtimestamp && end >= dbtimestamp) {

                day = array2['Day'];
                //  console.log(day);

                if (day === 'Monday') {
                    h1 = h1 + 1;
                } else if (day === 'Tuesday') {
                    h2 = h2 + 1;
                } else if (day === 'Wednesday') {
                    h3 = h3 + 1;
                } else if (day === 'Thursday') {
                    h4 = h4 + 1;
                } else if (day === 'Friday') {
                    h5 = h5 + 1;
                } else if (day === 'Saturday') {
                    h6 = h6 + 1;
                } else {
                    h7 = h7 + 1;
                }


            } else {
                //  console.log("else condition")
            }

        }
    }
    responsearr = [{ date: "Monday", sales2: h1 }, { date: "Tuesday", sales2: h2 }, { date: "Wednesday", sales2: h3 }, { date: "Thursday", sales2: h4 }, { date: "Friday", sales2: h5 }, { date: "Saturday", sales2: h6 }, { date: "Sunday", sales2: h7 }];

    return res.send(responsearr);
    //  return res.send({ message: "Total stamps", h0: h0, h1: h1, h2: h2, h3: h3, h4: h4, h5: h5 });


}
//**********get branch of stores*************

app.post('/storebranches', (req, res) => {

    var storename = req.body.store;
    console.log("nnnnnnnnnnnnnmmkkkk");


    var values = [];

    //   console.log("calling api")

    var arr = [];

    purchaseref.child(storename).once("value", function(snapshot) {
        if (snapshot) {
            values = Object.keys(snapshot.val());

            //    console.log(values.length)

            // setTimeout(() => {
            res.send({ "values": values, "length": values.length });
            // }, );

        }
    });

});
//*****************Get list of all stores************ 

app.get('/getstoreslist', (req, res) => {

    var values = [];

    // console.log("calling api")

    var arr = [];

    var p = purchaseref.once('value', function(snapshot) {
        if (snapshot) {
            values = Object.keys(snapshot.val());

            //console.log(values)

            // setTimeout(() => {
            res.send({ "values": values, "length": values.length });
            // }, );

        }
    });



});
//*******************************************

///*******stripe create customer**********/

app.post('/stripecreatecustomer', (req, res) => {

    console.log(req.body.email);

    arr = [];
    console.log(req.body.token_id);
    var key = req.body.key;

    console.log(key);

    var newcustomer = {};
    var newobj = {};

    stripe.customers.create({
            source: req.body.token_id,
            email: req.body.email
        },
        function(err, customer) {
            if (err) {
                console.log(err);
                res.send(err);

            } else {

                console.log(customer);
                var hopperRef = storeloginref.child(key);
                hopperRef.update({

                    "customer_id": customer.id,
                    "is_subscribe": 0

                });



                res.send(customer);

                // newobj = createCustomerAndSubscription(req.body, customer);

            }
        })


    // arr.push(newobj);

    // console.log(newobj);
    // console.log("sss***");

});

/********subscribe user*********/

app.post('/subscribeuser', (req, res) => {

    var key = req.body.key;

    var plan_id = req.body.plan_id;
    var customer_id = req.body.customer_id;

    stripe.subscriptions.create({
            customer: customer_id,
            items: [{ plan: plan_id }],
        },
        function(err, subscription) {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                console.log(subscription);

                var hopperRef = storeloginref.child(key);
                hopperRef.update({

                    "is_subscribe": 1

                });

                res.send(subscription);
            }
        });


});
/*********** Get Stripe plan List ********************* */

app.get('/getplanlist', (req, res) => {


    var token = req.body.token_id;

    stripe.plans.list({ limit: 3 },
        function(err, plans) {
            if (err) {
                console.log(err);
                res.send({ status: false, message: err });

            } else {
                console.log(plans);
                res.send({ status: true, data: plans });

            }

        }
    );
});

/*******************Get Card List*************************** */

app.post('/getCardlist', (req, res) => {

    var customer_id = req.body.customer_id;

    stripe.customers.listSources(
        customer_id, { object: 'card', limit: 3 },
        function(err, cards) {
            if (err) {
                res.send({ status: false, message: err });
            } else {
                res.send({ status: true, data: cards });

            }
        }
    );

    console.log(res);
});

/****************update credentials******************/

app.post('/updatecarddetails', (req, res) => {

    var customer_id = req.body.customer_id;
    var card_id = req.body.card_id;

    var exp_month = req.body.exp_month;
    var exp_year = req.body.exp_year;

    console.log(exp_month + "" + exp_year);


    stripe.customers.updateSource(
        customer_id,
        card_id, { exp_month: exp_month, exp_year: exp_year },
        function(err, card) {
            if (err) {
                console.log(err);
            } else {
                console.log(card);
                res.send({ "success": true, message: card });

            }
        }
    );
});



/**********get subscription by customer id*********/

app.post('/subscriptionlist', (req, res) => {

    var customer_id = req.body.customer_id;

    stripe.customers.retrieve(
        customer_id,
        function(err, customer) {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                console.log(customer);
                res.send(customer);
            }
        }
    );

});

/******cancel subscription********/

app.post('/cancelsubscription', (req, res) => {

    var subscription_id = req.body.subscription_id;

    stripe.subscriptions.del(
        subscription_id,
        function(err, confirmation) {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                console.log(confirmation);
                res.send(confirmation);
            }
        }
    );
});

///get customer/////////////


app.post('/getcustomer', (req, res) => {

    var email = req.body.email;

    storeloginref.orderByChild("Contact_Email").equalTo(email).on("child_added", function(snapshot) {

        snapshot.val();
        console.log(snapshot.val());

        //  console.log(Object.values(snapshot.val()));
        res.send(snapshot.val());
    })

    // var subscription_id = req.body.subscription_id;

    // stripe.subscriptions.del(
    //     subscription_id,
    //     function(err, confirmation) {
    //         if (err) {
    //             console.log(err);
    //             res.send(err);
    //         } else {
    //             console.log(confirmation);
    //             res.send(confirmation);
    //         }
    //     }
    // );
});

app.post('/getfreetrialdetails', (req, res) => {

    var email = req.body.email;

    storeloginref.orderByChild("Contact_Email").equalTo(email).on("child_added", function(snapshot) {

        snapshot.val();
        console.log(snapshot.val());

        //  console.log(Object.values(snapshot.val()));
        res.send(snapshot.val());
    });
});

app.post('/addnewPurchase', (req, res) => {
    var obj = {
        Date: "15/03/2020",
        Day: "Sunday",
        Device: "Android",
        Offline: "false",
        TagID: "N0CZPOOXIR9IOAI7",
        Time: "1:58",
        Timestamp: "1584217728"
    }
    redeemref.child('Testing5/TT005/M2sCbV4DkqWoiZOUT85').push(obj)
});


app.post('/testdate', (req, res) => {

    var sdt = "7.2.2020";


    var ssh = moment(sdt, 'DD/MM/YYYY');
    var ndt = dateFormat(ssh, "dd/mm/yyyy");


    // for month name////////////

    var dt = "09-Mar-2020";
    var sh = moment(dt, 'DD-MMM-YYYY').format("DD/MM/YYYY");

    res.send(ndt + "  " + sh);

});

app.post('/totalusergrowth', (req, res) => {
    var apitype = req.body.type;
    var date1 = [];
    var count = 0;
    var countArray = [];
    var obj = {};
    var elseArray = [];
    var storeReq = req.body.store;
    var device = [];

    return storeInteractionref.child(storeReq).once('value', (snapshot) => {
        if (snapshot.exists()) {

            // console.log(snapshot.val());

            let datearr = Object.keys(snapshot.val());
            let arr = Object.values(snapshot.val());

            for (let i = 0; i < arr.length; i++) {
                var date = datearr[i];

                count = arr[i]['Customer Count'];
                countArray.push({ "date": date, "sales2": count });

            }

            return res.send(countArray);

            // console.log("device type ddddttttt")
            // console.log(device)


        } else {
            obj = { date: 0, sales2: 0 };
            elseArray.push(obj);
            return res.send(elseArray);
        }

    })

});

app.post('/storeuserbreakdown', (req, res) => {

    console.log("calling api");

    var arr = [];
    var male = 0;
    var female = 0;
    var other = 0;
    var unknown = 0;

    var storeReq = req.body.store;

    console.log("store $$$ " + storeReq);


    purchaseref.child(storeReq).once('value', function(snapshot)

        {
            var total_count = 0;

            if (snapshot) {
                var myData = Object.keys(snapshot.val()).map(key => {
                    // console.log(snapshot.val()[key]);

                    return snapshot.val()[key];
                })


                for (var i = 0; i < myData.length; i++) {
                    var gender = myData[i]['User Gender'];

                    console.log(myData[i].values);

                    return 0;

                    //  console.log(gender);
                    if (gender === "male" || gender === "Male") {
                        male = male + 1;
                    } else if (gender === "female" || gender === "Female") {
                        female = female + 1;
                    } else if (gender === "other" || gender === "Other") {
                        other = other + 1;
                    } else {
                        unknown = unknown + 1;
                    }

                }
            }

            total_count = male + female + other;
            male_percentage = (male / total_count) * 100;
            male_percentage = male_percentage.toFixed(2);

            female_percentage = (female / total_count) * 100;
            female_percentage = female_percentage.toFixed(2);

            others_percentage = (other / total_count) * 100;
            others_percentage = others_percentage.toFixed(2);

            res.send({ message: "Gender Counts", "male": male, "female": female, "other": other, "unknown": unknown, male_percentage: male_percentage, female_percentage: female_percentage, others_percentage: others_percentage });

        });

});


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//-2019
exports.app = functions.https.onRequest(app);