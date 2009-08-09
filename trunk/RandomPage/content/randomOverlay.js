/*Instantiate a native JSON parser */
var nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);

/* Log a message on to the Error Console */
function Log(msg) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage(msg);
};

/*Function to eliminate duplicates off an array */
function EliminateDuplicates(arr) {
		var i,         
		len=arr.length,         
		out=[],         
		obj={};       
		for (i=0;i<len;i++) {       
			obj[arr[i]]=0;     
		}     
		for (i in obj) {
			out.push(i);     
		}     
		return out;   
};

  /* Generates a random character */
function RandomChars() {
	var chars = "abcdefghijklmnopqrstuvwxyz";
	var string_length = Math.floor(Math.random() * 2);
	var randomChars = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomChars += chars.substring(rnum,rnum+1);
	}
	return randomChars;
};

/*Function to wrap a static Error Retry counter */
function ErrorRetry() {
	var maxRetryAttempts = 4;
	var retryAttempts = maxRetryAttempts;
	
	this.Attempted = function() {
		retryAttempts--;
	}
	
	this.AttemptRetry = function() {
		return (retryAttempts >= 0);
	}
	
	this.ResetAttempts = function() {
		retryAttempts = maxRetryAttempts;
	}
};

/* Function to host the Seed Data Structure */
function SeedStructure() {
	var collection = [];
	
	var maxStructureSize = 100;
	
	var minQuerySize = 50;
	
	/* Log the collection to error console */
	this.Print = function() {
		Log("Seed Collection: " + collection);
	}
	
	/* Add more Seeds to the collection, 
		Shuffle the seed structure using Fisher-Yates shuffle
		Eliminate duplicates off the seed structure
		Pop random elements if the structure is full*/
	this.AddSeeds = function(array) {
		collection = collection.concat(array);
		
		for(var j, x, i = collection.length; i; j = parseInt(Math.random() * i), x = collection[--i], collection[i] = collection[j], collection[j] = x);
		
		collection = EliminateDuplicates(collection);

		if(collection.length > maxStructureSize) {
			for(var i = collection.length - maxStructureSize; i > 0 ; i-- ) {
				collection.pop();
			}
		}
			
		//this.Print();
	}
	
	/*Get an element from the stucture */
	this.GetSeed = function() {
		return collection[0];
	}
	
	/*Returns if there are minimum seeds to query */
	this.isFull = function() {
		return (collection.length >= minQuerySize);
	}
 
}

/*Instantiate a SeedStrcuture for use */
var seedStore = new SeedStructure();

/*Instantiate retry attempt counter */
var retry = new ErrorRetry();

var RandomPage = {
  
  /*Initialization function*/
  onLoad: function() {
    this.initialized = true;
  },

  /* Build the API url and send the request */
  onMenuItemCommand: function() {
    var urlSeparator = "/";
    var querySeparator = "?";
    var parmSeparator = "&";
  	var vendorUrl = "http://boss.yahooapis.com/ysearch";
  	var type="web";
  	var version="v1";
  	var query = "";
  	if(seedStore.isFull())
  		query = seedStore.GetSeed();
  	else
  		query = RandomChars();
  	var appid="DW7qvlfV34F4QFPcPbzL_WKiVCli7XJExR4woQHbW5sf8HBmRMYmnbiR92stux.j";
  	var format="json";
  	var view="keyterms";
  	var start=Math.floor(Math.random() * 1000);
  	var filter = "-porn,-hate";
  	
  	//Build the results URL similar to http://boss.yahooapis.com/ysearch/web/v1/a?appid=DW7qvlfV34F4QFPcPbzL_WKiVCli7XJExR4woQHbW5sf8HBmRMYmnbiR92stux.j&format=xml&view=keyterms 
  	var resultsUrl = vendorUrl + urlSeparator +
  		type + urlSeparator + 
  		version + urlSeparator +
  		query + querySeparator +
  		"appid=" + appid + parmSeparator +
  		"format=" + format + parmSeparator +
  		"view=" + view + parmSeparator + 
  		"start=" + start + parmSeparator +
  		"filter=" + filter 
	
	//Create a native XMLHttpRequest and send it to the BOSS API server
	var request =  Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
	request.open("GET",resultsUrl,false);
	request.send(null);
	
	//Log("Response: "  + request.responseText + "  " + request.readyState);

    try {
    	//Parse the JSON response with nativeJSON parser
		var searchResponse = nativeJSON.decode(request.responseText);
		var randomUrl = searchResponse.ysearchresponse.resultset_web[0].clickurl;
		
		//Log("Query : " + query + " start = " + start + " Click Url: " + randomUrl);
		
		try {
			seedStore.AddSeeds(searchResponse.ysearchresponse.resultset_web[0].keyterms.terms);
		}
		catch(ex) {
			//Log("terms: " +  searchResponse.ysearchresponse.resultset_web[0].keyterms.terms + " Exception:" + ex);
		}
		
		//Redirect the content window to the new location
    	window.content.location = randomUrl;
	
		retry.ResetAttempts();
	}
	catch(ex) {
		//Log("Response: " +request.responseText);
		if(retry.AttemptRetry()) {
			RandomPage.onMenuItemCommand();
			retry.Attempted();
		}
	}
   }
};

/* Add event listener to the window */
window.addEventListener("load", function(e) { RandomPage.onLoad(e); }, false); 


