#version 400 compatibility

#include "Complex.frag"
#include "Progressive2D-4.frag"
#info BurningShirp inspired by the good folks at FractalForums.com 2013-2017
#group BurningShirp

uniform int  RetryMax; slider[0,0,64]
uniform double RetryEntry; slider[0,0,64]
uniform double RetryBias; slider[0,0,64]
// Number of iterations
uniform int  Iterations; slider[10,200,10000]
uniform int  PreIter; slider[0,0,1000]

uniform double R; slider[0,0,1]
uniform double G; slider[0,0.4,1]
uniform double B; slider[0,0.7,1]
uniform double ColDiv; slider[1,256,384]

uniform double Power; slider[1,2,10]
uniform double Bailout; slider[0,6,384]

// 0=BurningShip 1=Perpendicular BurningShip 2=Perpendicular Mandelbrot
uniform int  Formula; slider[0,0,2]


uniform bool Julia; checkbox[false]
uniform dvec2 JuliaXY; slider[(-2,-2),(-0.6,1.3),(2,2)]
// Meta
uniform bool Meta; checkbox[false]
// Sin
uniform bool Sin; checkbox[false]

double dist = 0.;
dvec2 zmin = dvec2(1000000.0);

// Pickover's Stalks
uniform bool StalksInside; checkbox[false]
uniform bool StalksOutside; checkbox[false]

uniform bool Invert; checkbox[false]
// coordinate to invert to infinity
uniform dvec2 InvertC; slider[(-5,-5),(0,0),(5,5)]
// performs the active c = T(s)
dvec2 domainMap(dvec2 c)
{
	double s = dot(c,c);
	return c/s + InvertC;
}

dvec2 Plot(dvec2 a) {
	
	dvec2 b;
	
	b.x = sqrt ( a.x * a.x + a.y * a.y );
	b.y = atan ( float(a.y / a.x) );
	
	if ( a.x < 0.) b.y += 3.141592;
	
	b.x = pow( float(b.x) , float(Power) );
	b.y *= Power;
	
	a.x = cos( float(b.y) ) * b.x;
	a.y = sin( float(b.y) ) * b.x;

	return a;
}

dvec3 IQColor(double i, dvec2 zmin, dvec2 z) {
	// The color scheme here is based on one from Inigo Quilez's Shader Toy:
	// http://www.iquilezles.org/www/articles/mset_smooth/mset_smooth.htm
	double co;
	double p = Power*Power;
	
	if(Meta && Sin) co = i;
    //co = i + 1. - log(.5+.5*log2(length(z))/(.5+.5*log2(Power)))/log2(Bailout);
	//co = i - log(log2( dist )/log2( Bailout))/log2(Bailout );
	else
	if(!Meta && !Sin)
	  co = i - log(log( float(length(z)) ))/log( float(Power) );  // equivalent optimized smooth interation count
	else
	if(Meta && !Sin)
	  co = i - log(.5*log( float(dist) ) / log( float(p) ))/log( float(p) );
	else
	if(!Meta && Sin)
	  co =  i - (log2(log( float(dist) ))- log2(log( float(p) ))) / log( float(Bailout) );
	
	co = 6.2831*sqrt( co/ColDiv );
	
	return .5+.5*dvec3( cos( float(co+R) ), cos( float(co+G) ), cos( float(co+B) ));
}

dvec3 StalkColor( double i,dvec2 zmin) {
	dvec3 c;
	c.x = max(zmin.x, zmin.y)*R;
	c.y = min(zmin.x, zmin.y)*G;
	c.z = length(zmin)*B;
	c = sqrt(c*i);
	double p = sqrt(min(zmin.x, zmin.y)*12.);
	return sqrt(c * dvec3(p));
}

dvec3 color(dvec2 c) {
	int retry = 0;
	if(Invert) c = domainMap(-c);
	
	dvec2 z = Julia ?  c : dvec2(0.0,0.0);
	
	c = (Julia ? JuliaXY : c);
	
	int i;
	
	for(i=0;i<PreIter;i++) {
/*		if(Meta&&Sin) z = cSin(Plot( Plot(z)+c) ) + Plot(c) + z;
		else if(Meta&&!Sin) z = Plot( Plot(z)+c ) + Plot(c) + z;
		else if(!Meta&&Sin) z = cSin( Plot(z) )+c;
		else */
       z = Plot(z) + c;
	}

	for (i = 0; i < Iterations; i++) {

		
		if(Formula == 0) z=abs(z);// Burning Ship
		else if(Formula == 1) z.y=abs(z.y); // Perpendicular Burning Ship
		else if(Formula == 2) z.x=abs(z.x); // Perpendicular Mandelbrot
		
		z.y = -z.y; // invert y
		
		if(Meta&&Sin) z = cSin( vec2(Plot( Plot(z)+c)) ) + Plot(c) + z;
		else if(Meta&&!Sin) z = Plot( Plot(z)+c ) + Plot(c) + z;
		else if(!Meta&&Sin) z = cSin( vec2(Plot(z)) )+c;
		else z = Plot(z) + c;
    // Chris Thomasson
    // http://www.fractalforums.com/index.php?action=gallery;sa=view;id=20565
    if (z.x * z.x + z.y * z.y > RetryEntry)
    {
        if (retry < RetryMax)
        {
            z = z * (1./RetryBias);
            --i;
            ++retry;
            continue;
        }
    }

		dist = dot(z,z);
		zmin = min(zmin, abs(z));
		if (dist> Bailout) break;

	}
	
	dvec3 rColor;
	
	if (i < Iterations) {
		rColor = StalksOutside?StalkColor((double(i+PreIter)+.5)*.01,zmin): IQColor(double(i+PreIter)+3.14159,zmin,z);
	}  else {
		rColor = StalksInside?StalkColor((double(i+PreIter)+.5)*.01,zmin): dvec3(.0);
	}
	
	return rColor;
}

#preset Default
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.2410512,0.3870127
Zoom = 0.6484169
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 1000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 10
Power = 2
Bailout = 45
Formula = 0
Julia = false
JuliaXY = -0.2222222,0
Meta = false
Sin = false
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
RetryEntry = 0
RetryBias = 0
RetryMax = 0
#endpreset


#preset Meta2
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0272792,-0.0195041
Zoom = 0.64841
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 3704
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 2
Power = 2
Bailout = 20
Formula = 0
Julia = true
JuliaXY = 0,0.255814
Meta = true
Sin = false
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset PBS-Sin
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.1908178,0.0107101
Zoom = 0.6484169
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 1000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 3
Power = 2
Bailout = 45
Formula = 1
Julia = false
JuliaXY = 1.027659,0.9452871
Meta = false
Sin = true
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset BS-Sin
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.4867415,0.1649319
Zoom = 0.7456794
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 1000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 3
Power = 2
Bailout = 45
Formula = 0
Julia = false
JuliaXY = 1.027659,0.9452871
Meta = false
Sin = true
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
RetryEntry = 16
RetryBias = 5
RetryMax = 4
#endpreset

#preset PBS-Sin2
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0984506,-0.7763565
Zoom = 5.276206
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 10000
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 45
ColDiv = 7
Formula = 1
Meta = false
Sin = true
PreIter = 0
Julia = true
JuliaXY = -0.0830333,-0.6388889
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset PerpBurningShipSinJulia
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = 0.0035533,0.0222278
Zoom = 0.7456711
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 10000
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 45
ColDiv = 24
Formula = 1
Meta = false
Sin = true
PreIter = 2
Julia = true
JuliaXY = -0.1778443,-0.6383667
StalksInside = true
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset PerpBurningShipSinJuliaInvertC
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.00063,-0.0001092
Zoom = 0.022652
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 2000
PreIter = 16
R = 0.25
G = 0.5
B = 0.75
ColDiv = 16
Power = 2
Bailout = 45
Formula = 1
Julia = true
JuliaXY = -0.1780444,-0.6383667
Meta = false
Sin = true
StalksInside = false
StalksOutside = false
Invert = true
InvertC = 0,0
#endpreset

#preset PBSSJIC
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0001317,-0.0001637
Zoom = 0.1034339
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 1560
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 45
ColDiv = 9
Formula = 1
Meta = false
Sin = true
PreIter = 18
Julia = true
JuliaXY = 0.0267778,-0.6338889
StalksInside = false
StalksOutside = false
Invert = true
InvertC = 0,0
#endpreset

#preset MetaBSSJ
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0004163,-0.0006328
Zoom = 0.9861612
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 270
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 32
Power = 2
Bailout = 45
Formula = 0
Julia = true
JuliaXY = -1.193444,0.3390333
Meta = false
Sin = true
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset Monkey-Zee
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0055527,-0.0411465
Zoom = 0.0916399
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 2300
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 2
ColDiv = 35
Formula = 1
Meta = false
Sin = true
PreIter = 141
Julia = true
JuliaXY = -0.1780444,-0.6383667
StalksInside = true
StalksOutside = false
Invert = true
InvertC = 0,0
#endpreset

#preset Concept-Ion
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0882192,-0.0719938
Zoom = 0.069293
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 10000
R = 0.2065217
G = 0.5136612
B = 0.8216216
Power = 2
Bailout = 45
ColDiv = 8
Formula = 1
Meta = false
Sin = true
PreIter = 15
Julia = true
JuliaXY = -0.1780444,-0.6383667
StalksInside = true
StalksOutside = false
Invert = true
InvertC = 0,0
#endpreset

#preset SupportVessel
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -1.7553,0.0335209
Zoom = 23.1601
ToneMapping = 1
Exposure = 1
AARange = 1.5
AAExp = 10
GaussianAA = true
Iterations = 1959
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 24
ColDiv = 36
Formula = 0
Meta = false
Sin = false
PreIter = 0
Julia = false
JuliaXY = -0.2222222,0
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset CosmicScale
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0656281,0.0395089
Zoom = 12.20419
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 2000
PreIter = 15
R = 0.2065217
G = 0.5136612
B = 0.8216216
ColDiv = 8
Power = 2
Bailout = 45
Formula = 1
Julia = true
JuliaXY = -0.1780444,-0.6383667
Meta = false
Sin = true
StalksInside = true
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset Badger
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = 0.578286,0.0002611
Zoom = 14.03482
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 2791
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 16
ColDiv = 384
Formula = 1
Meta = false
Sin = true
PreIter = 0
Julia = true
JuliaXY = -0.1779333,-0.6383667
StalksInside = true
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset FooBrot
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.1082634,-0.0037357
Zoom = 1.134072
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 2791
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 45
ColDiv = 18
Formula = 1
Meta = false
Sin = true
PreIter = 0
Julia = true
JuliaXY = -0.8740741,-0.4296296
StalksInside = true
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset OhMy
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0235509,0.0006954
Zoom = 0.0930456
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 790
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 3
ColDiv = 9
Formula = 0
Meta = true
Sin = false
PreIter = 0
Julia = true
JuliaXY = 0.3488372,-0.372093
StalksInside = false
StalksOutside = false
Invert = true
InvertC = 0,-0.5813953
#endpreset

#preset DoDoBird
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = 4.616204,-0.9473326
Zoom = 0.0462601
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 790
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 8
ColDiv = 9
Formula = 1
Meta = true
Sin = false
PreIter = 0
Julia = true
JuliaXY = 0.0697674,0.2325581
StalksInside = false
StalksOutside = false
Invert = true
InvertC = 0.6976744,-0.8139535
#endpreset

#preset coolcurl
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.1931262,0.002277
Zoom = 0.9861612
ToneMapping = 1
Exposure = 1
AARange = 1.5
AAExp = 10
GaussianAA = true
Iterations = 2000
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 25
ColDiv = 24
Formula = 1
Meta = false
Sin = true
PreIter = 0
Julia = true
JuliaXY = -0.1779333,-0.6383667
StalksInside = true
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset HorseHeadNebulus
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = 0.0029751,0.740283
Zoom = 1.724782
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 2000
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 6
ColDiv = 9
Formula = 0
Meta = true
Sin = false
PreIter = 0
Julia = true
JuliaXY = 0.1569349,0.1190791
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset CrownJewel
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0049434,0.0167118
Zoom = 0.9861497
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 4000
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 24
ColDiv = 12
Formula = 0
Meta = true
Sin = false
PreIter = 0
Julia = true
JuliaXY = -0.273938,-0.5383395
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset Viking
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = 0.0002624,0.3552971
Zoom = 14.03466
ToneMapping = 1
Exposure = 1
AARange = 1.5
AAExp = 10
GaussianAA = true
Iterations = 3704
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 20
ColDiv = 2
Formula = 0
Meta = true
Sin = false
PreIter = 0
Julia = true
JuliaXY = -0.3971988,0.0697674
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset BS-Sin2
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = 8.13e-05,0.0122206
Zoom = 1.134072
ToneMapping = 1
Exposure = 1
AARange = 1.5
AAExp = 10
GaussianAA = true
Iterations = 1000
R = 0.25
G = 0.5
B = 0.75
Power = 2
Bailout = 45
ColDiv = 17.89706
Formula = 0
Meta = false
Sin = true
PreIter = 0
Julia = true
JuliaXY = -0.0939333,-0.246
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset Default-PM
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.3361494,-0.0222758
Zoom = 0.563841
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 1000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 16
Power = 2
Bailout = 384
Formula = 2
Julia = false
JuliaXY = 0.4651163,-0.9767442
Meta = false
Sin = false
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset PM-J
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.012118,-0.0127064
Zoom = 0.7456796
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 1000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 16
Power = 2
Bailout = 384
Formula = 2
Julia = true
JuliaXY = 0.4638163,-0.9772442
Meta = false
Sin = false
StalksInside = true
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset PM-S
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.2511332,-0.0127064
Zoom = 0.6484171
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 1000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 16
Power = 2
Bailout = 45
Formula = 2
Julia = false
JuliaXY = 0.0930233,0.5116279
Meta = false
Sin = true
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
RetryEntry = 32
RetryBias = 10
#endpreset

#preset PM-M
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0298778,-0.0038444
Zoom = 1.134085
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 1000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 16
Power = 2
Bailout = 70.67484
Formula = 2
Julia = false
JuliaXY = 0.0930233,0.5116279
Meta = true
Sin = false
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset PM-MS
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0298778,-0.0038444
Zoom = 0.5638408
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 1000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 16
Power = 2
Bailout = 70.67484
Formula = 2
Julia = false
JuliaXY = 0.0930233,0.5116279
Meta = true
Sin = true
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset PM-MSJ
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0176709,0.038939
Zoom = 0.9861612
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 9000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 16
Power = 2
Bailout = 7.067484
Formula = 2
Julia = true
JuliaXY = -0.2842256,0.1575907
Meta = true
Sin = true
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset

#preset PMJ-Stalks
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -0.0086359,0.2364985
Zoom = 1.49981
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 4000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 24
Power = 2
Bailout = 24
Formula = 2
Julia = true
JuliaXY = 0.4186047,-1
Meta = false
Sin = false
StalksInside = true
StalksOutside = true
Invert = false
InvertC = 0,0
#endpreset

#preset Wolf
Gamma = 2
Brightness = 1
Contrast = 1
Saturation = 1
Center = -4.1e-06,0.1057539
Zoom = 0.6484095
ToneMapping = 1
Exposure = 1
AARange = 1
AAExp = 2
GaussianAA = true
Iterations = 4000
PreIter = 0
R = 0.25
G = 0.5
B = 0.75
ColDiv = 24
Power = 2
Bailout = 24
Formula = 2
Julia = true
JuliaXY = -0.1557907,0.5587395
Meta = true
Sin = false
StalksInside = false
StalksOutside = false
Invert = false
InvertC = 0,0
#endpreset
