int divd=200;
int skyNumber=7;
int treeNumber=22;
PImage[] skyImages;
PImage[] treeImages;
PFont nushuFont;

void setup() {
  size(480, 640);
  pixelDensity(1);
  background(0);
  frameRate(10);
  skyImages = new PImage[skyNumber];
  treeImages = new PImage[treeNumber];
  for (int i=0; i<skyNumber; i++) {

    skyImages[i]= loadImage("sky/ " + i + " Medium.jpeg");
    if (skyImages[i]!=null) {
      skyImages[i].resize(width, height);
      println("成功加载: " + "sky/ " + i + " Medium..jpeg");
    }
  }
  for (int j=0; j<treeNumber; j++) {
    treeImages[j]= loadImage("tree/ "+ j + " Medium.jpeg");
    if (treeImages[j]!=null) {
      treeImages[j].resize(width, height);
      println("成功加载: " + "tree/ "+ j + " Medium.jpeg");
    }
  }
}
void draw() {
 
 
  background(230);
   
  int sIdx = int(map(mouseX, 0, width, 0, skyNumber - 1));
  int tIdx = int(map(mouseX, 0, width, 0, treeNumber - 1));
  sIdx = constrain(sIdx, 0, skyNumber - 1);
  tIdx = constrain(tIdx, 0, treeNumber - 1);
  //println(tIdx , skyImages[sIdx].width , skyImages[sIdx].height );

  for (int x=0; x<width; x+= width/divd) {
    for (int y=0; y<height; y+= height/divd) {


      color c = color(149);
      //color s = skyImages[sIdx].get(mouseX, mouseY);
      //color t = treeImages[tIdx].get(mouseX, mouseY);
      if (mouseY < height/2) {
        if (skyImages[sIdx] != null) {
          c = skyImages[sIdx].get(x, y);
          //fill(t);
          //ellipse(mouseX, mouseY, 10, 10);
        }
      } else {
        if (treeImages[tIdx] != null) {
          c = treeImages[tIdx].get(x, y);
          //fill(s);
          //ellipse(mouseX,mouseY,10,10);
        }
      }
      if (mousePressed) {
        fill(c, 220);
        noStroke();
        rectMode(CORNER);
        rect(x, y, width/divd, height/divd);
      } else {
        fill(c, 150);
        noStroke();
        ellipse(
          x+random(map(dist(x, y, mouseX, mouseY), 0, width, 0, 5)),
          y+random(map(dist(x, y, mouseX, mouseY), 0, height, 0, 5)),
          (width/divd)*noise(x,y)*frameCount*sin(x)*0.3,
          (height/divd)*noise(x,y)*frameCount*cos(y)*0.3);
      }
    }
  }



  fill(red(get(mouseX, mouseY)-100)+green(get(mouseX, mouseY)), blue(get(mouseX, mouseY)), 100);

  int distCenter=int(map(int(dist(width/2, height/2, mouseX, mouseY)), 100, height/2, 100, width/2));
  
  tint(255, 126);
  nushuFont = createFont("NyushuSerif-1.000.ttf", random(0.25*distCenter, 0.3*distCenter));
  
  textFont(nushuFont);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);

  textFont(nushuFont);
 
  
  if (mouseY < height/2) {
    if (skyImages[sIdx] != null) {

      copy(treeImages[tIdx], mouseX-(distCenter/2), mouseY-(distCenter/2), distCenter, distCenter, mouseX-(distCenter/2), mouseY-(distCenter/2), distCenter, distCenter);
    }
    text("天空", random(0.26*distCenter, 0.3*distCenter), random(0.26*distCenter, 0.3*distCenter) );//sky
    text("树木", mouseX, mouseY);//sky
  } else {
    if (treeImages[tIdx] != null) {
      

      copy(skyImages[sIdx],  mouseX-(distCenter/2), mouseY-(distCenter/2), distCenter, distCenter, mouseX-(distCenter/2), mouseY-(distCenter/2), distCenter, distCenter);
      text("树木", random(0.26*distCenter, 0.3*distCenter), height-random(0.26*distCenter, 0.3*distCenter) );//tree
      text("天空", mouseX, mouseY);//sky
      //fill(s);
      //ellipse(mouseX,mouseY,10,10);
    }
    fill(255,150);
   rectMode(CORNER);
   rect( mouseX-(distCenter/2), mouseY-(distCenter/2), distCenter, distCenter);
    println(distCenter);
  }
  
}
