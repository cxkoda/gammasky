/**
 * lambda longitude from meridian [-pi ... pi]
 * phi lattitude from equator [-0.5pi ... 0.5 pi]
 * see https://en.wikipedia.org/wiki/Hammer_projection
 */
function hammerProjectRelative(lambda, phi) {
  var denominator = Math.sqrt(1. + Math.cos(phi) * Math.cos(0.5 * lambda));
  var x = Math.cos(phi) * Math.sin(0.5 * lambda) / denominator;
  var y = Math.sin(phi) / denominator;
  return [x,y]
}

function hammerProject(lambda, phi) {
  var point = hammerProjectRelative(lambda, phi)
  return [2. * Math.sqrt(2.) * point[0], Math.sqrt(2.) * point[1]]
}

function computeRelativePosition(gal, relativeInset) {
  // var leftInset = 0.05
  // var rightInset = 0.05
  // var topInset = 0.05
  // var bottomInset = 0.05
  var leftInset = relativeInset[3]
  var rightInset = relativeInset[1]
  var topInset = relativeInset[0]
  var bottomInset = relativeInset[2]

  var xRange = 1 - leftInset - rightInset
  var yRange = 1 - topInset - bottomInset

  // Convert gal longitude to std longitude
  var lon = -gal.lon * Math.PI / 180 
  if (lon < - Math.PI) {
    lon += 2. * Math.PI
  }
  var lat = -gal.lat * Math.PI / 180 

  var proj = hammerProjectRelative(lon, lat)
  var relx = proj[0] * 0.5 + 0.5
  var rely = proj[1] * 0.5 + 0.5

  return {x: relx * xRange + leftInset, y: rely * yRange + topInset}
}

function setSkyPos(id, galLon, galLat, relativeInset, size) {
  var pos = computeRelativePosition(galLon, galLat, relativeInset)
  var obj = document.getElementById(id)
  // obj.setAttribute('x', pos[0])
  // obj.setAttribute('y', pos[1])
  console.log(pos)
  obj.setAttribute('transform', `translate(${pos[0]*size[0]},${pos[1]*size[1]})`)
}

function equatorial2galactic(equat, epoch){
  var ra = equat.ra
  var dec = equat.dec
  var d2r = Math.PI/180;
  // var r2d = 180/Math.PI;	// degrees to radians
  // var r2d = this.r2d;
  // var twopi = 2*Math.PI;

  var OB = 23.4333334*d2r;
  dec *= d2r;
  ra *= d2r;

  var a = (epoch && (epoch == "1950" || epoch == "B1950" || epoch == "FK4")) ? 27.4 : 27.128251;	// The RA of the North Galactic Pole
  var d = (epoch && (epoch == "1950" || epoch == "B1950" || epoch == "FK4")) ? 192.25 : 192.859481;	// The declination of the North Galactic Pole
  var l = (epoch && (epoch == "1950" || epoch == "B1950" || epoch == "FK4")) ? 33.0 : 32.931918;	// The ascending node of the Galactic plane on the equator
  var sdec = Math.sin(dec);
  var cdec = Math.cos(dec);
  var sa = Math.sin(a*d2r);
  var ca = Math.cos(a*d2r)

  var GT = Math.asin(cdec*ca*Math.cos(ra-d*d2r)+sdec*sa);
  var GL = Math.atan((sdec-Math.sin(GT)*sa)/(cdec*Math.sin(ra- d*d2r)*ca))/d2r;
  var TP = sdec-Math.sin(GT)*sa;
  var BT = cdec*Math.sin(ra-d*d2r)*ca;
  if(BT<0) GL=GL+180;
  else {
    if (TP<0) GL=GL+360;
  }
  GL = GL + l;
  if (GL>360) GL = GL - 360;

  var LG=Math.floor(GL);
  var LM=Math.floor((GL - Math.floor(GL)) * 60);
  var LS=((GL -Math.floor(GL)) * 60 - LM) * 60;
  var GT=GT/d2r;

  var D = Math.abs(GT);
  if (GT > 0) var BG=Math.floor(D);
  else var BG=(-1)*Math.floor(D);
  var BM=Math.floor((D - Math.floor(D)) * 60);
  var BS = ((D - Math.floor(D)) * 60 - BM) * 60;
  if (GT<0) {
    BM=-BM;
    BS=-BS;
  }

  return { lon: GL, lat: GT };
}


function equatorial2galacticRotation(equat, epoch){
  var ra = equat.ra
  var dec = equat.dec

  var h = 0.00000001;
  var pos0 = equatorial2galactic(equat, epoch);
  var posRa = equatorial2galactic({ra: ra + h, dec: dec}, epoch);
  var posDec = equatorial2galactic({ra: ra, dec: dec + h}, epoch);

  var dLondRa = (posRa.lon - pos0.lon) / h;
  var dLondDec = (posDec.lon - pos0.lon) / h;
  var dLatdRa = (posRa.lat - pos0.lat) / h;
  var dLatdDec = (posDec.lat - pos0.lat) / h;

  var dNormRa = Math.sqrt(dLondRa * dLondRa + dLatdRa * dLatdRa);
  var alpha = Math.acos(dLondRa / dNormRa);

  return -alpha + Math.PI;
}