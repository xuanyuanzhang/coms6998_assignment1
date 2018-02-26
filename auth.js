function onLoad() {
	var auth = initCognitoSDK();
	//auth.signOut()
	document.getElementById("signin_btn").addEventListener("click", function() {
		userButton(auth);
	});
	var curUrl = window.location.href;
	auth.parseCognitoWebResponse(curUrl);
}

function userButton(auth) {
	var state = document.getElementById('signInButton').innerHTML;
	if (state === "Sign Out") {
		document.getElementById("signin_btn").innerHTML = "Sign In";
		auth.signOut();
		showSignedOut();
	} else {
		auth.getSession();
		showSignedIn()
	}
}

function showSignedOut() {
	alert("sign out success")
	document.getElementById("signin_btn").innerHTML = "Sign In"
}

// Operations when signed in.
function showSignedIn() {
	alert("sign in success")
	document.getElementById("signin_btn").innerHTML = "Sign Out"
}

// Initialize a cognito auth object.
function initCognitoSDK() {
	var authData = {
		ClientId : '5k64r422vq6akb8isikqol47t', // Your client id here
		AppWebDomain : 'cc-chatbot.auth.us-east-2.amazoncognito.com', // Exclude the "https://" part. 
		TokenScopesArray : ['openid','email'], // like ['openid','email','phone']...
		RedirectUriSignIn : 'https://s3.us-east-2.amazonaws.com/chatbotsignin/index.html',
		RedirectUriSignOut : 'https://s3.us-east-2.amazonaws.com/chatbotsignin/index.html',
		IdentityProvider : '', 
                UserPoolId : 'us-east-2_nUjbUv90C', 
                AdvancedSecurityDataCollectionFlag : false
	};
	var auth = new AWSCognito.CognitoIdentityServiceProvider.CognitoAuth(authData);
	auth.userhandler = {
		// onSuccess: <TODO: your onSuccess callback here>,
		// onFailure: <TODO: your onFailure callback here>
		//* E.g.
		onSuccess: function(result) {
			console.log("Sign in success");
			
			//config aws credentials
			AWS.config.update({
			  region: 'us-east-2'
			});

			AWS.config.credentials = new AWS.CognitoIdentityCredentials({
		      IdentityPoolId: 'us-east-2:4537d29a-34eb-4bf3-80cc-479e176669e8',
		      Logins: {
		        'cognito-idp.us-east-2.amazonaws.com/us-east-2_nUjbUv90C': result.getIdToken().getJwtToken()
		      }
		    });
		    //refresh credentials
		    
		    AWS.config.credentials.refresh((error) => {
		      if (error) {
		        console.error(error);
		      } else {
		        console.log('Successfully logged!');
		      }
		    });
		    //get credentials
		    AWS.config.credentials.get(function(){

			    // Credentials will be available when this function is called.
			    var accessKeyId = AWS.config.credentials.accessKeyId;
			    var secretAccessKey = AWS.config.credentials.secretAccessKey;
			    var sessionToken = AWS.config.credentials.sessionToken;
			    console.log("get credentials")
			    console.log(accessKeyId)
			    console.log(secretAccessKey)
			    console.log(sessionToken)
			    apigClient = apigClientFactory.newClient({
		          accessKey: accessKeyId,
		          secretKey: secretAccessKey,
		          sessionToken: sessionToken,
		          region: 'us-east-2'
		        });
		        

		},
		onFailure: function(err) {
			alert("Error!" + err);
		}
	};
	// The default response_type is "token", uncomment the next line will make it be "code".
	//auth.useCodeGrantFlow();
	return auth;
}