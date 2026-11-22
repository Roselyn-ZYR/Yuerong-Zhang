import processing.video.*;

Capture cam;

void setup() {
  size(640, 480);

  String[] cameras = Capture.list();

  if (cameras.length == 0) {
    println("There are no cameras available for capture.");
    exit();
  } else {
    println("Available cameras:");
    for (int i = 0; i < cameras.length; i++) {
      println(cameras[i]);
    }

    // The camera can be initialized directly using an
    // element from the array returned by list():
    cam = new Capture(this, cameras[0]);
    cam.start();
  }
}

void draw() {
  if (cam.available() == true) {
    cam.read();
  }

  cam.loadPixels();//will return cam.piexls
  for (int x = 0; x<cam.width; x+=2) {
    for (int y = 0; y<cam.height; y+=2) {
      int i=x+y*width;
      color c = cam.pixels[i];
      if (dist(mouseX, mouseY, x, y)<80) {
        colorMode(HSB);
        cam.pixels[i]=color(hue(c), saturation(c)-10, brightness(c)+10);
      } else if (mouseX>width/2) {
        cam.pixels[i]=color(red(c)+50, green(c), blue(c)+50);
      } else {
        cam.pixels[i]=color(red(c), green(c)+50, blue(c)+50);
      }
    }
  }


  /* for (int i = 0; i<cam.pixels.length; i++) {
   color c= cam.pixels[i];
   if (brightness(c)>128) {
   cam.pixels[i]=color(red(c)+50, green(c), blue(c)+50);
   } else {
   cam.pixels[i]=color(red(c), green(c)+50, blue(c)+50);
   }
   }
   */
  cam.updatePixels();
  if (mousePressed) {
    image(cam, mouseX + 0.3*(int(map(sin(frameCount*0.2), -1, 1, 0, width/2))), mouseY+0.2*(int(map(cos(frameCount*0.1), -1, 1, 0, height/2))));
  } else {
    image(cam, 0, 0);
  }
}
