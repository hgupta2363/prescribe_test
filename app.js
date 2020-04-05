var app=require('express')()
const cors=require('cors')
const bodyParser=require('body-parser');
const ejs=require("ejs")
const path=require("path")
const Razorpay=require("razorpay")
const url=require("url")
const request=require("request")
port=process.env.PORT || 5000;
var firebase = require("firebase");
require('dotenv').config();

const key_id=process.env.KEY_ID
const key_secret=process.env.KEY_SECRET
var data={}
app.use(cors());
var dets=[]
// var serviceAccount = require('C:/Users/chdno/Desktop/All desktop Files/PresAssignment/my-app/backend/prescribetask-firebase-adminsdk-jh3c7-d97cd99717.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://speech-f3243.firebaseio.com/"
// });
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));
const config = {
    apiKey: process.env.API_KEY_FIREBASE,
    authDomain: "speech-f3243.firebaseapp.com",
    databaseURL: "https://speech-f3243.firebaseio.com",
    projectId: "speech-f3243",
    storageBucket: "speech-f3243.appspot.com",
    messagingSenderId: "26831214028",
    appId: process.env.API_ID
  };
  firebase.initializeApp(config);

  // Get a reference to the database service
  var database= firebase.database();




  var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret:process.env.KEY_SECRET
  })

// var expressSession=require('express-session')
// app.use(expressSession({secret:'max',saveUninitialised:false,re save:false}))
// app.get('/',(req,res,next)=>{
//     usersRef.ref()on('value',snap=>{
//       res.send(snap.val())
//     })
// })
app.get('/payment_status',(req,res,next)=>{
    res.send(data)
})
app.get('/payment/:id1',(req,res)=>{
    console.log("test")
    const data=req.params.id1.split(',')
    console.log(data)
    var options = {
        amount: Number(data[6])*100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "rcptid_17",
        payment_capture: '0'
        
      };
      instance.orders.create(options, function(err, order) {
          console.log(order)
         res.render("respose.ejs",{id:order.id,data:data})
         res.end()
      });
})
app.post('/callback',(req,res,next)=>{
    console.log("test")
    console.log(req.body)
    request('https://'+key_id+':'+key_secret+'@api.razorpay.com/v1/payments/'+req.body.razorpay_payment_id, function (error, response, body) {
 console.log(body)
    data=body
res.render("payment_status",{body:body})
});
})
app.post('/patientDetail',(req,res,next)=>{
    console.log(req.body )
    const user_id=database.ref('/patients_data').push().key
    const HospitalName="NIZAR";
    database.ref('/patients_data/NIZAR').child(user_id).set({
        pid:user_id,
        age:req.body.age,
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        sex:req.body.sex,
        address:req.body.address,
        DoctorId:req.body.docId,
        HospitalName:HospitalName,
        docName:req.body.docName,
        Slot:req.body.Slot
    })
    
    res.send({status:true,PatientId:user_id,HosName:HospitalName})
})
app.get('/final/:name',(req,res,next)=>{
    database.ref('/patients_data/NIZAR/'+req.params.name).once('value',snap=>{
       res.send(snap.val())
    })
})
app.get('/getData',(req,res,next)=>{
    
    var doc=new Array();
    var today = new Date();
    if(today.getMonth()+1<=9)
    var Month='0'+(today.getMonth()+1);
    console.log(Month)
    if(today.getDate()<=9)
    var todayDate='0'+(today.getMonth()+1);
    var date =todayDate+'-'+Month+'-'+today.getFullYear();
    console.log(date)
    const usersRef=database.ref(`schedule/${date}`);
    usersRef.once('value')
    .then(function(snapshot){
           snapshot.forEach(function(childSnapshot){
                doc.push(childSnapshot.val())
            })
            res.send(doc)
    }).catch(err=>{
        console.log(err)
    })  
  
})

app.post('/newUser',(req,res,next)=>{
    const user_id=usersRef.push().key;
    const email=req.body.email;
    const username=req.body.username;
    usersRef.orderByChild('email').equalTo(email).once('value').then((snapshot)=>{
        if(snapshot.val()!=null)
        {
            res.json({error:"This Email ID Exist Already"})
            console.log(snapshot.val())
        }
         //if Email Exist Already
        else 
        {
            usersRef.orderByChild('username').equalTo(username).once('value').then((snapshot)=>{
                if(snapshot.val()!=null)
                res.json({error:"Username Already Registered Try Different"}) // f username Exist Already
                else
                {
                usersRef.child(user_id).set({
                    username:req.body.username,
                    bloodGroup:req.body.bloodGroup,
                    age:req.body.age,
                    dateOfBirth:req.body.dateOfBirth,
                    email:req.body.email,
                    password:req.body.password
                })
                res.send({status:true})
               }
            })
        }
    })
})
app.get("/",(req,res)=>{
    response.send("test")
})
app.post('/Login',(req,res,next)=>{
    const checkData={
    email:req.body.email,
    password:req.body.password
    }
    usersRef.orderByChild('email').equalTo(checkData.email).once('value')
    .then((snapshot)=>{
            
        if(!snapshot.val()) {
           
                res.json({error:"User Not Registered",session:false})      
        }   
        else{
            snapshot.forEach(function(childSnapshot){
                var PrimaryKey=childSnapshot.key;
                if(childSnapshot.val().password==checkData.password)
                {
                   
                    const LoggedUser=childSnapshot.key;
                    res.json({LoggedUser,session:true,sessionID:PrimaryKey})
                }
                else
                {
                    res.json({error:'Wrong Password',session:false})
                }
            })
        }
        
    }).catch(err=>{
        console.log(err);
})
})
app.get('/:id',(req,res,next)=>{
    database.ref('users/'+req.params.id).once('value')
    .then((snapshot)=>{
    res.send(snapshot.val())
    })
    
})
app.post('/Logout',(req,res,next)=>{
//    req.session.ID=null;
   res.json({
       destroyed:true
   })
})

app.listen(port,()=>{
    console.log(`Runninnnn on ${port}`)
})
process.on('uncaughtException', function (err) {
    console.log(err);
}); 


// http.createServer(function (req, res) {

// 	switch(req.url){
// 		case "/process":
// 			var params 						= {};
// 			params['MID'] 					= PaytmConfig.mid;
// 			params['WEBSITE']				= PaytmConfig.website;
// 			params['CHANNEL_ID']		= 'WEB';
// 			params['INDUSTRY_TYPE_ID']	= 'Retail';
// 			params['ORDER_ID']			= 'TEST_'  + new Date().getTime();
// 			params['CUST_ID'] 			= 'Customer001';
// 			params['TXN_AMOUNT']			= '1.0';
// 			params['CALLBACK_URL']		= 'http://localhost:'+port+'/';
// 			params['EMAIL']				= 'abc@mailinator.com';
// 			params['MOBILE_NO']			= '123456';

// 			checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {

// 				var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
// 				// var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
				
// 				var form_fields = "";
// 				for(var x in params){
// 					form_fields += "<input type='hidden' name='"+x+"' value='"+params[x]+"' >";
// 				}
// 				form_fields += "<input type='hidden' name='CHECKSUMHASH' value='"+checksum+"' >";

// 				res.writeHead(200, {'Content-Type': 'text/html'});
// 				res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="'+txn_url+'" name="f1">'+form_fields+'</form><script type="text/javascript">document.f1.submit();</script></body></html>');
//                 res.end();
// 			});
// 		break;
	
// 		case "/callback":

// 			var body = '';
	        
// 	        req.on('data', function (data) {
// 	            body += data;
// 	        });

// 	        req.on('end', function () {
// 				var html = "";
// 				var post_data = qs.parse(body);


// 				// received params in callback
// 				console.log('Callback Response: ', post_data, "\n");
// 				html += "<b>Callback Response</b><br>";
// 				for(var x in post_data){
// 					html += x + " => " + post_data[x] + "<br/>";
// 				}
// 				html += "<br/><br/>";


// 				// verify the checksum
// 				var checksumhash = post_data.CHECKSUMHASH;
// 				// delete post_data.CHECKSUMHASH;
// 				var result = checksum_lib.verifychecksum(post_data, PaytmConfig.key, checksumhash);
// 				console.log("Checksum Result => ", result, "\n");
// 				html += "<b>Checksum Result</b> => " + (result? "True" : "False");
// 				html += "<br/><br/>";



// 				// Send Server-to-Server request to verify Order Status
// 				var params = {"MID": PaytmConfig.mid, "ORDERID": post_data.ORDERID};

// 				checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {

// 					params.CHECKSUMHASH = checksum;
// 					post_data = 'JsonData='+JSON.stringify(params);

// 					var options = {
// 						hostname: 'securegw-stage.paytm.in', // for staging
// 						// hostname: 'securegw.paytm.in', // for production
// 						port: 8080,
// 						path: '/merchant-status/getTxnStatus',
// 						method: 'POST',
// 						headers: {
// 							'Content-Type': 'application/x-www-form-urlencoded',
// 							'Content-Length': post_data.length
// 						}
// 					};


// 					// Set up the request
// 					var response = "";
// 					var post_req = https.request(options, function(post_res) {
// 						post_res.on('data', function (chunk) {
// 							response += chunk;
// 						});

// 						post_res.on('end', function(){
// 							console.log('S2S Response: ', response, "\n");

// 							var _result = JSON.parse(response);
// 							html += "<b>Status Check Response</b><br>";
// 							for(var x in _result){
// 								html += x + " => " + _result[x] + "<br/>";
// 							}

// 							res.writeHead(200, {'Content-Type': 'text/html'});
// 							res.write(html);
// 							res.end();
// 						});
// 					});

// 					// post the data
//                     post_req.write(post_data);
//                     console.log(post_data)
// 					post_req.end();
// 				});
// 	        });
			
// 		break;
// 	}
	

// }).listen(port2);
