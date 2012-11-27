(function($) {
	
  var notifications = window.notifications || window.webkitNotifications,
  canvas, ctx;

  navigator.getUserMedia = window.navigator.webkitGetUserMedia || navigator.getUserMedia;

	// get a reference to the iframe that holds the app
	iframe = document.getElementById("iframe");

	  // initialize the postman. he's off of MYAPP. He needs to know
    // who the recipient is. It's the iframe where the app lives.
    $.pkg.init(iframe.contentWindow);

    // subscribe to the /select/image message and return an image using
    // the native api file picker in chrome packaged apps
    $.pkg.listen("/select/file", function() {
    
        chrome.fileSystem.chooseFile({ type: "openFile"}, function(entry) {
    
          // this gives us a file entry. We just need to read it.
          entry.file(function(file) {
    
            // create a new file reader
            var reader = new FileReader();
    
            // create an event for when the file is done reading
            reader.onloadend = function(e) {
              // tell the postman to deliver this to the sandbox
              $.pkg.send("/file/loaded", [this.result])
            }
    
            // read the file as a data URL
            reader.readAsDataURL(file);
        
          });
        
        });   
    });

    $.pkg.listen("/contextMenu/item/add", function(title, type) {
      // add a new context menu item
      chrome.contextMenus.create({ id: title, title: title, type: type }, 
      function() {
        if (chrome.runtime.lastError) {
          $.pkg.send("/contextMenu/item/created", [ false, chrome.runtime.lastError.message ]);
        } 
        else {
          $.pkg.send("/contextMenu/item/created", [ true ]);
        }
      });
    });

    $.pkg.listen("/notifications/create", function(title, message) {
      notifications.createNotification(null, title, message).show(); // note the show()
    });

    $.pkg.listen("/start/camera", function() {

      draw = function() {
        requestAnimationFrame(draw);
        update();
      };
      
      update = function() {
        
        var buffer, img;
        
        try {
          ctx.drawImage(video, 0, 0, video.width, video.height);
        } catch (ex) {

        }
        
        img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        buffer = img.data.buffer;
      
        $.pkg.send("/camera/update", [ buffer ]);
      };

      success = function(stream) {
        var video = document.getElementById("video");
        canvas = document.getElementById("canvas");
        ctx = canvas.getContext("2d");
        var e = window.URL || window.webkitURL;
        video.src = e ? e.createObjectURL(stream) : stream;
        video.play();
        return draw();
      };
      
      failure = function() {
        return update = function() {
          paused = true;
          return $.pkg.send("/camera/error");
        };
      };

      navigator.getUserMedia({ video: true }, success, failure);

    });

})(jQuery);