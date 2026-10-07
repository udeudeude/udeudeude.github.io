# Starfinder Second Edition Homebrewery Toolkit v7
<!--
PASTE THIS ENTIRE FILE INTO A BLANK HOMEBREWERY BREW.

Goals:
- self-contained: no image assets required
- original visual language, not a copy of Paizo trade dress
- useful Starfinder 2e authoring structures, not merely a themed page
- tested against actual Homebrewery multi-page rendering
- art-first layouts informed by current Starfinder 2e published page patterns

Visible ART SLOT blocks are intentional placeholders showing where published-style illustration can live.
Replace them with the recipes on the Art & Image Cookbook page.

The sample rules text demonstrates layout and workflow. Treat bespoke mechanics
as authoring examples rather than official Starfinder rules text.
-->

<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Oxanium:wght@500;600;700&family=Rajdhani:wght@500;600;700&display=swap');

:root{
  --sf-ink:#17262d;
  --sf-muted:#5b7077;
  --sf-white:#fbfcfc;
  --sf-paper:#f5f7f7;
  --sf-navy:#143849;
  --sf-navy2:#0f2a38;
  --sf-cyan:#5fcbd7;
  --sf-cyan-pale:#dff3f5;
  --sf-blue:#287b9b;
  --sf-purple:#684a9c;
  --sf-magenta:#b63f95;
  --sf-red:#bd4252;
  --sf-gold:#d9a044;
  --sf-line:#9db8be;
  --sf-facet:rgba(22,54,71,.11);
}

/*
  VISUAL TARGET
  The current Starfinder 2e books use a bright white reading field, dark navy
  structures, cyan information bands, magenta/purple navigation accents,
  angular/faceted edge geometry, and art that frequently breaks the text grid.
  This toolkit follows that vocabulary without copying Paizo's exact trade dress.
*/

.page{
  font-family:"IBM Plex Sans",sans-serif;
  color:var(--sf-ink);
  background-color:var(--sf-white) !important;
  background-image:
    linear-gradient(90deg,var(--sf-cyan) 0 63%,var(--sf-magenta) 63% 81%,var(--sf-purple) 81% 100%),
    linear-gradient(135deg,transparent 0 65%,rgba(41,111,136,.055) 65% 72%,transparent 72%),
    linear-gradient(45deg,transparent 0 78%,rgba(111,71,151,.045) 78% 84%,transparent 84%) !important;
  background-size:100% 1.2mm,70mm 70mm,62mm 62mm !important;
  background-position:0 7mm,right -15mm bottom -12mm,left -18mm top 48mm !important;
  background-repeat:no-repeat !important;
  padding:16mm 16mm 15mm 17mm;
  position:relative;
  overflow:hidden;
}
.page::before{
  content:"" !important;
  position:absolute;z-index:0;right:-1mm;top:15mm;width:8mm;height:94mm;
  background:linear-gradient(180deg,var(--sf-purple),var(--sf-magenta) 62%,var(--sf-cyan));
  clip-path:polygon(50% 0,100% 5%,100% 95%,45% 100%,12% 78%,12% 18%);
  opacity:.92;
}
.page::after{
  content:"" !important;
  position:absolute;z-index:0;left:-17mm;bottom:-16mm;width:68mm;height:48mm;
  background:linear-gradient(135deg,transparent 22%,rgba(17,50,65,.07) 22% 48%,transparent 48% 58%,rgba(94,71,150,.05) 58%);
  transform:rotate(-7deg);
}
.page>*{position:relative;z-index:1;}

.page h1,.page h2,.page h3,.page h4{
  font-family:"Oxanium",sans-serif;
  text-transform:uppercase;
  break-after:avoid;
}
.page h1{
  color:var(--sf-navy);
  font-size:24pt;line-height:.94;letter-spacing:-.035em;
  padding:0 0 5px;margin:0 0 7px;
  border-bottom:2px solid var(--sf-cyan);
  position:relative;
}
.page h1::before{
  content:"";position:absolute;left:-9px;top:3px;width:5px;height:76%;
  background:var(--sf-magenta);clip-path:polygon(0 0,100% 10%,100% 90%,0 100%);
}
.page h1::after{
  content:"";position:absolute;right:0;bottom:-2px;width:26%;height:2px;
  background:var(--sf-magenta);
}
.page h2{font-size:15.5pt;color:var(--sf-navy);margin:8px 0 3px;letter-spacing:-.025em;}
.page h3{font-size:10.9pt;color:var(--sf-magenta);margin:7px 0 2px;letter-spacing:-.01em;}
.page h4{font-size:9pt;color:var(--sf-navy);margin:6px 0 2px;}
.page p,.page li{font-size:8.15pt;line-height:1.27;}
.page p{margin:3px 0 5px;}
.page strong{color:#173f51;}
.page hr{border:0;height:1px;background:var(--sf-line);margin:5px 0;}
.page blockquote{border-left:3px solid var(--sf-cyan);background:var(--sf-cyan-pale);padding:5px 8px;}

.sf-wide{column-span:all;width:100%;}
.sf-clear{column-span:all;height:1px;}
.sf-kicker{font-family:"Rajdhani",sans-serif;font-weight:700;font-size:7.2pt;letter-spacing:.17em;text-transform:uppercase;color:var(--sf-magenta);}
.sf-micro{font-family:"Rajdhani",sans-serif;font-size:6.1pt;line-height:1.15;letter-spacing:.1em;text-transform:uppercase;color:var(--sf-muted);}
.sf-code{font-family:"Rajdhani",sans-serif;font-size:7pt;letter-spacing:.06em;}

/* Published-book-like page furniture: thin top rails + an outer-edge index tab. */
.sf-page-tag{
  position:absolute;right:-16mm;top:27mm;z-index:20;width:8mm;
  background:var(--sf-magenta);color:white;padding:7px 4px 8px;
  font-family:"Rajdhani";font-size:6.4pt;font-weight:700;letter-spacing:.13em;text-transform:uppercase;
  writing-mode:vertical-rl;transform:rotate(180deg);
  border-radius:0 0 7px 7px;
}
.sf-headerline{
  column-span:all;display:flex;justify-content:space-between;align-items:center;
  margin:-2px 0 6px;padding:0 9mm 3px 0;border-bottom:1px solid #a9c3c8;
}
.sf-headerline .id{font-family:"Rajdhani";font-size:6.2pt;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#5d737a;}

/*
  COVER: deliberately normal-flow rather than absolutely positioned. Homebrewery's
  column wrapper can collapse an absolute full-page child in multi-page preview.
  This fills a US-letter page by expanding back across the page padding.
  Add cover art with style="--sf-hero-art:url('IMAGE_URL')".
*/
.sf-hero{
  --sf-hero-art:none;
  column-span:all;
  position:relative;z-index:5;color:white;overflow:hidden;
  width:calc(100% + 33mm);
  height:279.4mm;
  margin:-16mm -16mm -15mm -17mm;
  break-inside:avoid;
  background-image:
    linear-gradient(90deg,rgba(8,19,29,.91),rgba(14,37,53,.62) 48%,rgba(48,22,60,.46)),
    var(--sf-hero-art),
    radial-gradient(circle at 76% 23%,rgba(181,63,149,.58),transparent 25%),
    radial-gradient(circle at 27% 75%,rgba(73,201,214,.48),transparent 29%),
    linear-gradient(138deg,#0c1723,#133a4d 47%,#23183b);
  background-size:cover,cover,cover,cover,cover;
  background-position:center,center,center,center,center;
}
.sf-hero::before{
  content:"";position:absolute;inset:0;
  background:linear-gradient(145deg,transparent 0 62%,rgba(255,255,255,.05) 62% 68%,transparent 68%),
             linear-gradient(36deg,transparent 0 71%,rgba(94,214,224,.07) 71% 76%,transparent 76%);
}
.sf-hero .frame{position:absolute;left:14mm;right:14mm;top:14mm;bottom:14mm;border:1px solid rgba(105,220,229,.50);clip-path:polygon(0 0,87% 0,100% 8%,100% 100%,11% 100%,0 92%);}
.sf-hero .scan{position:absolute;right:22mm;top:22mm;width:55mm;height:55mm;border:1px solid rgba(111,224,232,.45);border-radius:50%;}
.sf-hero .scan::before,.sf-hero .scan::after{content:"";position:absolute;border:1px solid rgba(193,91,173,.5);border-radius:50%;}
.sf-hero .scan::before{inset:8mm}.sf-hero .scan::after{inset:18mm;border-color:rgba(111,224,232,.65)}
.sf-hero .needle{position:absolute;left:50%;top:50%;width:23mm;height:1px;background:#7ce7ed;transform-origin:left;transform:rotate(-33deg);}
.sf-hero .content{position:absolute;left:22mm;right:23mm;top:43mm;z-index:3;}
.sf-display{font-family:"Oxanium",sans-serif;font-size:39pt;line-height:.84;font-weight:700;text-transform:uppercase;letter-spacing:-.045em;color:white;text-shadow:0 2px 0 rgba(0,0,0,.25);}
.sf-deck{font-family:"Rajdhani";font-size:14pt;line-height:1.05;color:#d7f4f6;width:72%;}
.sf-hero .bar{width:69mm;height:5px;margin:12px 0 11px;background:linear-gradient(90deg,var(--sf-cyan),var(--sf-magenta));clip-path:polygon(7px 0,100% 0,calc(100% - 7px) 100%,0 100%);}
.sf-hero .coords{position:absolute;right:21mm;bottom:20mm;z-index:3;text-align:right;font-family:"Rajdhani";font-size:6.8pt;line-height:1.35;letter-spacing:.16em;color:#a6d9df;}
.sf-hero .sigil{position:absolute;left:25mm;bottom:25mm;width:28mm;height:28mm;border:2px solid rgba(216,170,81,.6);border-radius:50%;z-index:3;}
.sf-hero .sigil::before{content:"◇";position:absolute;inset:0;display:grid;place-items:center;font-family:"Oxanium";font-size:19pt;color:rgba(225,189,108,.78);transform:rotate(12deg);}

/* Common information structures. Less HUD, more printed Starfinder. */
.sf-panel,.sf-mission,.sf-warning,.sf-datapad,.sf-transmission,.sf-dossier,.sf-card{
  position:relative;break-inside:avoid;margin:6px 0;padding:7px 9px 8px;
  border:1px solid var(--sf-line);background:white;
}
.sf-panel,.sf-card{border-top:3px solid var(--sf-cyan);}
.sf-mission{border-top:4px solid var(--sf-navy);background:linear-gradient(90deg,var(--sf-cyan-pale),white 62%);}
.sf-warning{border:1px solid #d1a055;border-top:4px solid var(--sf-gold);background:#fff9ef;}
.sf-datapad{color:#edf9fa;background:var(--sf-navy);border:0;border-bottom:4px solid var(--sf-cyan);box-shadow:inset 0 -8px 0 rgba(255,255,255,.035);}
.sf-datapad strong{color:white;}
.sf-transmission{background:#f2eef8;border:1px solid #a893be;border-left:5px solid var(--sf-purple);}
.sf-dossier{border-left:5px solid var(--sf-purple);background:#f5f7f8;}
.sf-dossier::after{content:"DOSSIER";position:absolute;right:7px;top:4px;font-family:"Rajdhani";font-size:5.6pt;font-weight:700;letter-spacing:.17em;color:#7c8e94;}
.sf-label{font-family:"Rajdhani";font-size:7pt;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--sf-navy);margin-bottom:3px;}
.sf-datapad .sf-label{color:#79e2e8}.sf-warning .sf-label{color:#8e5a24}.sf-transmission .sf-label{color:#624486}

.sf-grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px}.sf-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.sf-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.sf-band{column-span:all;margin:7px 0 8px;padding:4px 9px 4px 12px;background:var(--sf-navy);border-left:7px solid var(--sf-magenta);color:white;font-family:"Rajdhani";font-size:8.8pt;font-weight:700;letter-spacing:.13em;text-transform:uppercase;}
.sf-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin:6px 0 8px;}
.sf-step{min-height:31mm;padding:6px;background:#f7f9f9;border-top:4px solid var(--sf-cyan);font-size:7.3pt;line-height:1.18;position:relative;}
.sf-step:nth-child(4),.sf-step:nth-child(5){border-top-color:var(--sf-magenta)}
.sf-step b{display:block;font-family:"Oxanium";font-size:7.5pt;text-transform:uppercase;color:var(--sf-navy);margin-bottom:3px}.sf-step .num{position:absolute;right:4px;top:2px;font-family:"Rajdhani";font-size:17pt;font-weight:700;color:rgba(39,93,108,.16)}

/* Rules vocabulary: cyan name bars + clean stat text echo current Alien Core. */
.sf-traits{margin:2px 0 5px}.sf-trait{display:inline-block;padding:1px 6px;margin:0 3px 3px 0;font-family:"Rajdhani";font-size:6.7pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border:1px solid #70a5af;background:#e6f4f5;color:#214957}.sf-trait.rare{background:#eee6f4;border-color:#9473aa;color:#62386e}.sf-trait.unique{background:#f5e1e4;border-color:#bd6b76;color:#7c303b}
.sf-stat{break-inside:avoid;margin:6px 0 8px;padding:0 8px 7px;border:1px solid #9ab4ba;background:white;position:relative;}
.sf-stat .name{font-family:"Oxanium";font-size:14.8pt;font-weight:700;line-height:.98;text-transform:uppercase;color:white;background:var(--sf-navy);margin:0 -8px 5px;padding:4px 30mm 3px 8px;border-top:4px solid var(--sf-cyan);}
.sf-stat .level{position:absolute;right:8px;top:5px;z-index:3;font-family:"Rajdhani";font-size:8.6pt;font-weight:700;color:#f4d2ea;text-transform:uppercase;}
.sf-rule{height:2px;background:var(--sf-cyan);margin:3px 0 5px}.sf-stat p{margin:2px 0;font-size:7.75pt;line-height:1.2}
.sf-action{display:inline-grid;place-items:center;width:13px;height:13px;margin:0 2px;font-family:"IBM Plex Sans";font-weight:700;font-size:7px;color:white;background:var(--sf-navy);transform:rotate(45deg);vertical-align:1px}.sf-action>span{transform:rotate(-45deg)}
.sf-reaction{display:inline-block;width:13px;height:13px;line-height:9px;text-align:center;border:2px solid var(--sf-purple);border-radius:50%;font-weight:700;font-size:7px;color:var(--sf-purple)}

.sf-table table{width:100%;font-size:7.1pt;border-collapse:collapse}.sf-table th{font-family:"Rajdhani";font-size:6.9pt;text-transform:uppercase;letter-spacing:.07em;color:white;background:var(--sf-navy);padding:3px 4px}.sf-table td{padding:3px 4px;border-bottom:1px solid #b8ccd1}.sf-table tr:nth-child(even) td{background:var(--sf-cyan-pale)}
.sf-meter{height:7px;background:#d2e0e2;margin:2px 0 4px;overflow:hidden}.sf-meter span{display:block;height:100%;background:linear-gradient(90deg,var(--sf-cyan),var(--sf-magenta))}
.sf-clock{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin:5px 0}.sf-clock span{display:block;padding:4px 3px;text-align:center;border:1px solid #9db8bf;background:white;font-family:"Rajdhani";font-size:6.6pt;font-weight:700;text-transform:uppercase}.sf-clock .on{background:var(--sf-navy);color:white;border-color:var(--sf-navy)}.sf-clock .hot{background:var(--sf-magenta);color:white;border-color:var(--sf-magenta)}

/* System, network, and ship diagrams retain a darker technical mode. */
.sf-system{column-span:all;height:72mm;position:relative;margin:6px 0 8px;overflow:hidden;border:1px solid #6c9ca8;background:radial-gradient(circle at 50% 50%,rgba(81,193,205,.12),transparent 5%),linear-gradient(135deg,#122a37,#152131);}
.sf-system::before{content:"";position:absolute;inset:0;background:radial-gradient(circle,rgba(255,255,255,.65) 0 1px,transparent 1.4px) 0 0/39px 39px,repeating-radial-gradient(ellipse at center,transparent 0 24px,rgba(91,211,220,.25) 25px 26px,transparent 27px 49px);opacity:.7}.sf-body{position:absolute;border-radius:50%;z-index:2;box-shadow:0 0 0 2px rgba(255,255,255,.5),0 0 10px rgba(85,207,217,.3)}.sf-body.star{width:21px;height:21px;left:48%;top:45%;background:#d9a64b;box-shadow:0 0 20px rgba(233,175,76,.8)}.sf-body.one{width:11px;height:11px;left:27%;top:40%;background:#55b3c1}.sf-body.two{width:17px;height:17px;right:22%;top:27%;background:#8a66b2}.sf-body.three{width:9px;height:9px;left:59%;bottom:12%;background:#bd5b9f}.sf-maplabel{position:absolute;z-index:3;padding:2px 5px;border:1px solid rgba(103,214,222,.55);background:rgba(10,29,39,.83);color:#dff8f9;font-family:"Rajdhani";font-size:6.2pt;font-weight:700;letter-spacing:.07em;text-transform:uppercase}
.sf-net{column-span:all;height:98mm;position:relative;margin:6px 0 7px;overflow:hidden;background:#102b37;border:1px solid #55aebb}.sf-net::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 17px,rgba(87,208,218,.06) 17px 18px),repeating-linear-gradient(90deg,transparent 0 17px,rgba(87,208,218,.06) 17px 18px)}.sf-node{position:absolute;z-index:4;width:32mm;padding:4px 5px;text-align:center;color:white;background:#174353;border:1px solid #62d1da;font-family:"Rajdhani";font-size:6.6pt;font-weight:700;text-transform:uppercase}.sf-node.core{background:#522f67;border-color:#cc78ba}.sf-node.lock{background:#554324;border-color:#d6a74c}.sf-line{position:absolute;z-index:2;height:2px;background:#6f9ba6;transform-origin:left center}.sf-line.hot{height:3px;background:var(--sf-magenta)}.sf-line.safe{background:#75e4eb}
.sf-ship{column-span:all;position:relative;height:67mm;margin:5px 0 7px;color:#dff7f9;background:linear-gradient(140deg,#112431,#172e42);border:1px solid #609eab;overflow:hidden}.sf-ship::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(110deg,transparent 0 53px,rgba(92,206,217,.05) 53px 55px)}.sf-silhouette{position:absolute;left:29%;top:21%;width:43%;height:42%;background:linear-gradient(90deg,#77d6dd,#b6f2f4);clip-path:polygon(0 42%,18% 29%,32% 0,57% 23%,84% 27%,100% 48%,83% 60%,62% 61%,42% 100%,28% 63%,8% 60%);opacity:.85;filter:drop-shadow(0 0 9px rgba(93,220,228,.5))}.sf-ship .readout{position:absolute;left:8mm;top:7mm;width:38mm;font-family:"Rajdhani";font-size:6.5pt;letter-spacing:.08em;text-transform:uppercase}.sf-ship .readout.right{left:auto;right:8mm;text-align:right}.sf-phase{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin:5px 0}.sf-phase div{min-height:17mm;padding:4px;border-top:3px solid var(--sf-cyan);background:#f7f9f9;font-size:6.7pt;line-height:1.16}.sf-phase div:nth-child(4),.sf-phase div:nth-child(5){border-color:var(--sf-magenta)}.sf-phase b{font-family:"Rajdhani";font-size:6.8pt;text-transform:uppercase;color:var(--sf-navy)}
.sf-track{display:flex;gap:3px;margin:4px 0 6px}.sf-track span{flex:1;height:8px;border:1px solid #86aab3;background:#dce8ea}.sf-track .done{background:var(--sf-cyan)}.sf-track .risk{background:var(--sf-magenta)}.sf-chase{display:grid;grid-template-columns:repeat(6,1fr);gap:3px;margin:5px 0}.sf-chase div{min-height:23mm;padding:3px;background:#f7f9f9;border-bottom:3px solid #739fac;font-family:"Rajdhani";font-size:6.4pt;line-height:1.1}.sf-chase div:nth-child(even){border-bottom-color:var(--sf-purple)}.sf-chase b{display:block;text-transform:uppercase;color:var(--sf-navy)}
.sf-swatch{min-height:25mm;padding:5px;border:1px solid #9cb7bd;border-top:3px solid var(--sf-cyan);background:white}.sf-swatch b{display:block;font-family:"Oxanium";font-size:7.2pt;text-transform:uppercase;color:var(--sf-navy)}.sf-swatch code{font-size:6.5pt}

/* -------------------------------------------------------------------------
   ART & IMAGE SYSTEM
   Every image helper uses a plain <img>, so authors can point at any image URL.
   object-position gives focal-point control without editing the source art.
   ------------------------------------------------------------------------- */
.sf-art-banner{
  --focus-x:50%;--focus-y:50%;
  column-span:all;position:relative;height:61mm;margin:5px 0 8px;overflow:hidden;
  background:#dbe7e9;border-top:4px solid var(--sf-cyan);
  clip-path:polygon(0 0,100% 0,100% 88%,94% 100%,0 100%);
}
.sf-art-banner img{width:100%;height:100%;display:block;object-fit:cover;object-position:var(--focus-x) var(--focus-y);}
.sf-art-banner::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,30,42,.43),transparent 42%),linear-gradient(0deg,rgba(11,34,45,.46),transparent 35%);pointer-events:none;}
.sf-art-banner .sf-art-caption{position:absolute;z-index:2;left:7mm;bottom:5mm;max-width:65%;color:white;text-shadow:0 1px 2px #000;font-family:"Rajdhani";font-size:7pt;letter-spacing:.04em;}

.sf-art-window{--focus-x:50%;--focus-y:50%;position:relative;overflow:hidden;border:1px solid #87a9b2;border-top:4px solid var(--sf-cyan);background:#dce7e9;margin:5px 0 7px;}
.sf-art-window img{display:block;width:100%;height:100%;object-fit:cover;object-position:var(--focus-x) var(--focus-y);}
.sf-art-window.landscape{height:45mm}.sf-art-window.portrait{height:66mm}.sf-art-window.square{height:52mm}
.sf-art-credit{font-family:"Rajdhani";font-size:5.6pt;line-height:1.1;text-transform:uppercase;letter-spacing:.05em;color:#667b82;margin-top:2px;}

/* Transparent PNG / WEBP character or creature art, book-style, with text wrap. */
.sf-cutout-right{float:right;width:47%;margin:1mm -4mm 2mm 5mm;shape-outside:polygon(24% 0,100% 0,100% 100%,4% 100%,13% 63%,0 31%);shape-margin:4mm;position:relative;z-index:4;}
.sf-cutout-left{float:left;width:47%;margin:1mm 5mm 2mm -3mm;shape-outside:polygon(0 0,78% 0,100% 29%,87% 69%,96% 100%,0 100%);shape-margin:4mm;position:relative;z-index:4;}
.sf-cutout-right img,.sf-cutout-left img{display:block;width:100%;height:auto;filter:drop-shadow(0 2px 2px rgba(18,42,52,.28));}

/* Outer-edge bleed, useful for tall character/environment art. */
.sf-edge-art-right{position:absolute;z-index:0;right:-16mm;top:29mm;width:88mm;height:205mm;overflow:hidden;pointer-events:none;}
.sf-edge-art-left{position:absolute;z-index:0;left:-17mm;top:29mm;width:88mm;height:205mm;overflow:hidden;pointer-events:none;}
.sf-edge-art-right img,.sf-edge-art-left img{width:100%;height:100%;object-fit:cover;object-position:center;}
.sf-edge-art-right{mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.15) 18%,black 53%);}
.sf-edge-art-left{mask-image:linear-gradient(270deg,transparent 0%,rgba(0,0,0,.15) 18%,black 53%);}

/* Art behind a short chapter/section opener. */
.sf-art-opener{--sf-opener-art:none;column-span:all;position:relative;min-height:82mm;margin:-5mm -3mm 7mm;padding:14mm 12mm 9mm;color:white;overflow:hidden;background-image:linear-gradient(90deg,rgba(8,25,37,.92) 0 37%,rgba(11,31,44,.45) 64%,rgba(11,31,44,.12)),var(--sf-opener-art),linear-gradient(135deg,#17394a,#40295f);background-size:cover;background-position:center;}
.sf-art-opener::after{content:"";position:absolute;left:0;right:0;bottom:0;height:7mm;background:linear-gradient(90deg,var(--sf-cyan),var(--sf-magenta),var(--sf-purple));clip-path:polygon(0 72%,78% 72%,82% 0,100% 0,100% 100%,0 100%);}
.sf-art-opener h1{color:white;border:0;margin-top:10mm;text-shadow:0 2px 3px rgba(0,0,0,.5)}.sf-art-opener h1::before,.sf-art-opener h1::after{display:none}.sf-art-opener p{max-width:55%;font-size:9pt;}

/* Maps/diagrams: preserve the whole image; never crop tactical information. */
.sf-map-frame{column-span:all;margin:5px 0 7px;padding:4mm;background:#edf2f3;border:1px solid #83a7b0;border-top:4px solid var(--sf-navy);position:relative;}
.sf-map-frame img{display:block;width:100%;height:auto;object-fit:contain;background:white;}
.sf-map-frame .sf-art-credit{padding-top:2px;}

/* Image strip / gallery for locations, ancestries, gear, NPCs. */
.sf-art-strip{column-span:all;display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:3px;height:51mm;margin:5px 0 8px;overflow:hidden;}
.sf-art-strip figure{margin:0;position:relative;overflow:hidden;background:#dce7e9}.sf-art-strip img{width:100%;height:100%;object-fit:cover;display:block}.sf-art-strip figcaption{position:absolute;left:0;right:0;bottom:0;padding:3px 5px;background:rgba(10,35,47,.79);color:white;font-family:"Rajdhani";font-size:6pt;text-transform:uppercase;letter-spacing:.06em;}

/* Published-layout art helpers. These fill the common patterns seen in current
   Starfinder interiors: landscape opener, half-page plate, inset feature, spot art,
   edge bleed, transparent cutout, and no-crop map. */
.sf-art-feature-right,.sf-art-feature-left{
  --focus-x:50%;--focus-y:50%;width:46%;height:58mm;overflow:hidden;position:relative;z-index:3;
  margin:2mm 0 4mm;background:#dce7e9;border-top:4px solid var(--sf-cyan);
}
.sf-art-feature-right{float:right;margin-left:6mm}.sf-art-feature-left{float:left;margin-right:6mm}
.sf-art-feature-right img,.sf-art-feature-left img{width:100%;height:100%;object-fit:cover;object-position:var(--focus-x) var(--focus-y);display:block}
.sf-art-feature-right::after,.sf-art-feature-left::after{content:"";position:absolute;inset:0;box-shadow:inset 0 -10mm 16mm rgba(9,35,47,.16);pointer-events:none}

.sf-art-half{
  --focus-x:50%;--focus-y:50%;column-span:all;height:103mm;margin:6px 0 8px;position:relative;overflow:hidden;
  border-top:4px solid var(--sf-cyan);background:#dce7e9;
  clip-path:polygon(0 0,100% 0,100% 93%,96% 100%,0 100%);
}
.sf-art-half img{width:100%;height:100%;object-fit:cover;object-position:var(--focus-x) var(--focus-y);display:block}
.sf-art-half .sf-art-caption{position:absolute;left:7mm;bottom:5mm;max-width:68%;padding:3px 6px;background:rgba(10,35,47,.82);color:white;font-family:"Rajdhani";font-size:7pt;letter-spacing:.05em;text-transform:uppercase}

.sf-art-plate{
  --focus-x:50%;--focus-y:50%;column-span:all;height:205mm;margin:4px 0 0;position:relative;overflow:hidden;background:#dce7e9;
}
.sf-art-plate img{width:100%;height:100%;object-fit:cover;object-position:var(--focus-x) var(--focus-y);display:block}
.sf-art-plate .sf-overlay{position:absolute;left:7mm;bottom:8mm;width:78mm;padding:8px 10px;background:rgba(15,42,56,.91);border-left:5px solid var(--sf-magenta);color:white}
.sf-art-plate .sf-overlay h2{color:white;margin-top:0}

.sf-spot-art-right,.sf-spot-art-left{width:38%;max-height:76mm;position:relative;z-index:4;margin:1mm 0 3mm}
.sf-spot-art-right{float:right;margin-left:5mm}.sf-spot-art-left{float:left;margin-right:5mm}
.sf-spot-art-right img,.sf-spot-art-left img{display:block;width:100%;height:auto;max-height:76mm;object-fit:contain}

.sf-art-placeholder{
  position:relative;overflow:hidden;background:
    linear-gradient(135deg,transparent 0 23%,rgba(255,255,255,.12) 23% 31%,transparent 31% 66%,rgba(182,63,149,.14) 66% 75%,transparent 75%),
    linear-gradient(135deg,#173b4c,#286b7d 55%,#65478f);
  border-top:4px solid var(--sf-cyan);color:white;
}
.sf-art-placeholder::before{content:"ART SLOT";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:"Oxanium";font-size:12pt;letter-spacing:.08em;white-space:nowrap;text-transform:uppercase;opacity:.82}
.sf-art-placeholder::after{content:attr(data-ratio);position:absolute;right:5mm;bottom:4mm;font-family:"Rajdhani";font-size:6pt;letter-spacing:.12em;text-transform:uppercase;opacity:.8}
.sf-art-slot-wide{column-span:all;height:49mm;margin:6px 0 8px;clip-path:polygon(0 0,100% 0,100% 88%,95% 100%,0 100%)}
.sf-art-slot-portrait{height:67mm;width:44%;float:right;margin:2mm 0 4mm 6mm}
.sf-art-slot-strip{column-span:all;display:grid;grid-template-columns:1.35fr 1fr 1fr;gap:3px;height:36mm;margin:6px 0 8px}
.sf-art-slot-strip>div{height:100%}


/* Live official-art examples. These use Paizo-hosted transparent PNGs from
   Paizo Blog pages and retain their original proportions. For a published
   project, follow the applicable Paizo license and consider self-hosting the
   permitted asset rather than depending on a remote hotlink forever. */
.sf-official-art-demo{
  column-span:all;display:grid;grid-template-columns:1fr 1fr;gap:8mm;
  min-height:96mm;margin:6px 0 8px;padding:5mm 7mm 3mm;
  background:linear-gradient(115deg,#f8fbfb,#edf4f5);border-top:4px solid var(--sf-navy);
  border-bottom:1px solid #9db8bf;position:relative;overflow:hidden;
}
.sf-official-art-demo figure{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:0}
.sf-official-art-demo img{display:block;width:auto;max-width:100%;height:73mm;object-fit:contain;filter:drop-shadow(0 3px 3px rgba(10,35,47,.18))}
.sf-official-art-demo figcaption{width:100%;padding-top:3px;border-top:2px solid var(--sf-cyan);font-family:"Rajdhani";font-size:6.2pt;line-height:1.15;color:#45656e;text-align:left}
.sf-official-art-demo b{color:var(--sf-navy)}
.sf-paizo-credit{font-family:"Rajdhani";font-size:5.9pt;line-height:1.15;color:#557078;margin-top:2px}
.sf-paizo-credit a{color:var(--sf-magenta);text-decoration:none}
.sf-live-cutout{width:42%;float:right;margin:-2mm -1mm 3mm 6mm;position:relative;z-index:5;text-align:center}
.sf-live-cutout img{display:block;width:100%;height:79mm;object-fit:contain;filter:drop-shadow(0 3px 3px rgba(10,35,47,.18))}
.sf-live-cutout .sf-paizo-credit{border-top:2px solid var(--sf-cyan);padding-top:2px;text-align:left}

.sf-art-clear{clear:both;height:1px}

/* Full-width editorial composition for real character/creature art. This avoids
   the tiny-art problem caused by floats inside Homebrewery's two-column flow. */
.sf-live-feature{
  column-span:all;display:grid;grid-template-columns:1.12fr .88fr;gap:7mm;
  align-items:start;margin:5px 0 8px;padding:5mm 6mm 4mm;
  background:linear-gradient(110deg,#f9fbfb 0 56%,#edf4f5 56% 100%);
  border-top:4px solid var(--sf-navy);border-bottom:1px solid #9eb9bf;position:relative;overflow:hidden;
}
.sf-live-feature::after{content:"";position:absolute;right:-8mm;bottom:-12mm;width:62mm;height:31mm;background:linear-gradient(120deg,transparent 0 25%,rgba(44,190,205,.16) 26% 48%,rgba(181,61,146,.15) 49% 70%,transparent 71%);transform:skewX(-18deg);pointer-events:none}
.sf-live-feature-copy{min-width:0;position:relative;z-index:2}
.sf-live-feature-copy .sf-stat,.sf-live-feature-copy .sf-dossier{margin-top:0}
.sf-live-feature-art{position:relative;z-index:2;min-height:116mm;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}
.sf-live-feature-art img{display:block;width:auto;max-width:100%;height:105mm;object-fit:contain;filter:drop-shadow(0 4px 4px rgba(10,35,47,.22))}
.sf-live-feature-art .sf-paizo-credit{width:100%;border-top:2px solid var(--sf-cyan);padding-top:3px;margin-top:1mm}

/* Larger official-art plate used as a reference page, not a thumbnail gallery. */
.sf-official-art-demo.v6{min-height:118mm;padding:6mm 8mm 4mm;gap:10mm}
.sf-official-art-demo.v6 img{height:94mm}
.sf-official-art-demo.v6 figcaption{font-size:6.5pt;padding-top:4px}

.sf-recipe-grid{column-span:all;display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin:5px 0 7px}
.sf-recipe{break-inside:avoid;border:1px solid #9eb9bf;border-top:4px solid var(--sf-cyan);background:white;padding:5mm;min-height:54mm}
.sf-recipe h3{margin-top:0}
.sf-recipe code{font-size:6.3pt;line-height:1.2}
.sf-recipe.magenta{border-top-color:var(--sf-magenta)}
.sf-recipe.purple{border-top-color:var(--sf-purple)}
.sf-codeblock{
  margin:4px 0 0;padding:4px 6px;background:#eef4f5;border-left:3px solid var(--sf-navy);
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:5.8pt;line-height:1.28;
  color:#243d48;white-space:normal;overflow-wrap:anywhere;word-break:break-word;
}
.sf-codeblock.magenta{border-left-color:var(--sf-magenta)}
.sf-codeblock.purple{border-left-color:var(--sf-purple)}

/* Keep art from swallowing rules text when printing. */
@media print{
  .sf-cutout-right img,.sf-cutout-left img{filter:none}
}
</style>

<div class="sf-hero">
  <div class="frame"></div>
  <div class="scan"><div class="needle"></div></div>
  <div class="content">
    <div class="sf-kicker" style="color:#83e6ec">Pact Worlds Field Series // 02</div>
    <div class="sf-display">Signal<br>at Kestrel-9</div>
    <div class="bar"></div>
    <div class="sf-deck">A science-fantasy mission that doubles as a reusable Starfinder Second Edition authoring toolkit.</div>
    <p style="width:69%;margin-top:20px;color:#c8e5e8">A dead relay begins transmitting tomorrow’s emergency traffic. The crew has six hours to decide whether the future is a warning, a trap, or both.</p>
  </div>
  <div class="sigil"></div>
  <div class="coords">LOCAL NODE: K-9<br>DRIFT SYNC: UNSTABLE<br>ARCANE LAYER: ACTIVE<br>ACCESS: CREW CLEARANCE</div>
</div>

\page

<div class="sf-page-tag">Mission</div>
<div class="sf-headerline"><span class="sf-kicker">Adventure Architecture</span><span class="id">K9 // BRIEF 01</span></div>

# Signal at Kestrel-9

<div class="sf-mission sf-wide">
<div class="sf-label">Mission Brief // Levels 3–5</div>
A dormant communications relay in the Diaspora has powered itself on and begun broadcasting encrypted distress calls timestamped **19 hours in the future**. The messages identify the crew by name and describe a cascade failure that has not happened yet.
</div>

<div class="sf-steps sf-wide">
<div class="sf-step"><span class="num">01</span><b>Hook</b>The crew receives a distress call in its own voices.</div>
<div class="sf-step"><span class="num">02</span><b>Approach</b>Kestrel-9 answers navigation queries but denies being online.</div>
<div class="sf-step"><span class="num">03</span><b>Complication</b>Prediction ghosts begin opening and sealing routes ahead of the crew.</div>
<div class="sf-step"><span class="num">04</span><b>Choice</b>Destroy, isolate, steal, or trust the predictive core.</div>
<div class="sf-step"><span class="num">05</span><b>Fallout</b>The chosen future becomes easier to reach and harder to avoid.</div>
</div>

## Pressure Engine

<div class="sf-panel">
<div class="sf-label">Escalation Clock</div>
<div class="sf-clock"><span class="on">1 // Trace</span><span class="on">2 // Lock</span><span>3 // Breach</span><span class="hot">4 // Cascade</span></div>
Advance after loud failures, excessive delay, or forcing a secured system. Especially strong solutions can step it backward when fictionally appropriate.
</div>

## What the GM tracks

<div class="sf-card">
<div class="sf-label">Three moving variables</div>
**Alert** measures how aggressively the station responds.  
**Prediction confidence** measures how strongly tomorrow is converging.  
**Corporate proximity** measures how soon Vantage Meridian arrives.
</div>

<div class="sf-datapad">
<div class="sf-label">Readout // recurring image</div>
Every display aboard the relay occasionally flashes the same magenta timestamp: **T+19:02**. It appears even on equipment with no network connection.
</div>

## Scene menu

<div class="sf-table">

| Scene | Purpose | Pressure | Revelation |
|:--|:--|:--|:--|
| Silent Dock | Entry / tone | leaking atmosphere | the station expected them |
| Relay Spine | navigation | locked bulkheads | future traffic is internally generated |
| Habitat Ring | social / search | scavengers | someone lived here recently |
| Prediction Core | hacking / choice | escalating countermeasures | forecasts alter decision-making |
| Extraction | consequence | arriving corporate tug | ownership becomes the final obstacle |

</div>

<div class="sf-art-placeholder sf-art-slot-wide" data-ratio="recommended 2.4:1">
</div>
<div class="sf-micro sf-wide">Optional scene art. Replace this placeholder with an <code>.sf-art-banner</code> block and an image URL; the page composition remains intact.</div>

\page

<div class="sf-page-tag">Threats</div>
<div class="sf-headerline"><span class="sf-kicker">Encounter File</span><span class="id">K9 // BIO 04</span></div>

# Threat & Encounter Toolkit

<div class="sf-stat">
<div class="level">Creature 4</div>
<div class="name">Parallax Scavenger</div>
<div class="sf-traits"><span class="sf-trait">Aberration</span><span class="sf-trait">Medium</span><span class="sf-trait rare">Quantum</span></div>
<div class="sf-rule"></div>
<p><strong>Perception</strong> +11; darkvision, motion sense 30 feet</p>
<p><strong>Languages</strong> understands Common; cannot speak</p>
<p><strong>Skills</strong> Acrobatics +12, Stealth +13, Thievery +10</p>
<p><strong>Str</strong> +2, <strong>Dex</strong> +4, <strong>Con</strong> +2, <strong>Int</strong> −1, <strong>Wis</strong> +2, <strong>Cha</strong> +0</p>
<hr>
<p><strong>AC</strong> 21; <strong>Fort</strong> +10, <strong>Ref</strong> +14, <strong>Will</strong> +10; <strong>HP</strong> 62</p>
<p><strong>Probability Flicker</strong> <span class="sf-reaction">R</span> <em>Trigger</em> The scavenger is targeted by an attack. <em>Effect</em> It briefly occupies a neighboring possibility and gains a circumstance bonus against the triggering attack.</p>
<hr>
<p><strong>Speed</strong> 30 feet, climb 20 feet</p>
<p><strong>Melee</strong> <span class="sf-action"><span>1</span></span> phase claw +14 (agile), <strong>Damage</strong> 2d8+5 slashing</p>
<p><strong>Skip Step</strong> <span class="sf-action"><span>2</span></span> Teleport a short distance to a space it can see; its next Strike this turn gains additional force damage.</p>
</div>

<div class="sf-warning">
<div class="sf-label">Hazard // Temporal Shear</div>
**Stealth** DC 21 • **Disable** Computers DC 22 or Engineering DC 20. On activation, local geometry jumps forward a fraction of a second, scattering creatures and exposing them to follow-up attacks.
</div>

<div class="sf-band">Encounter intent</div>

<div class="sf-grid3 sf-wide">
<div class="sf-card"><div class="sf-label">Behavior</div><strong>Steal, don't kill.</strong><br>The scavenger wants powered devices and data modules.</div>
<div class="sf-card"><div class="sf-label">Terrain</div><strong>Vertical relay spine.</strong><br>Ladders, ducts, zeroed lifts, exposed cabling.</div>
<div class="sf-card"><div class="sf-label">Twist</div><strong>Its future self assists.</strong><br>A second silhouette appears one round before it arrives.</div>
</div>

## Tactics by state

<div class="sf-table">

| State | What changes |
|:--|:--|
| Unnoticed | stalks whoever carries the strongest transmitter |
| Pressured | uses mobility to split the party and steal a device |
| Bloodied | retreats toward the Prediction Core |
| Cornered | deliberately triggers a temporal hazard |
| Escapes | reappears later with knowledge copied from stolen gear |

</div>

<div class="sf-transmission">
<div class="sf-label">Incoming // T+19:02</div>
**VOICEPRINT MATCH: YOUR CAPTAIN**  
“Do not open the maintenance ring. If you already did, cut power to the relay and leave us here.”
</div>

\page

<div class="sf-page-tag">Gear</div>
<div class="sf-headerline"><span class="sf-kicker">Arsenal & Technology</span><span class="id">K9 // KIT 12</span></div>

# Gear & Rules Modules

<div class="sf-stat">
<div class="level">Item 5</div>
<div class="name">Forked-Future Beacon</div>
<div class="sf-traits"><span class="sf-trait">Tech</span><span class="sf-trait">Invested</span><span class="sf-trait rare">Uncommon</span></div>
<div class="sf-rule"></div>
<p><strong>Usage</strong> worn &nbsp; <strong>Bulk</strong> L</p>
<p>This coin-sized predictor samples several near-future sensor states and feeds a compressed probability model into the wearer’s HUD.</p>
<p><strong>Activate</strong> <span class="sf-action"><span>1</span></span> envision. The device briefly exposes one likely outcome; the exact mechanical implementation should be tuned to the intended item level.</p>
</div>

<div class="sf-panel">
<div class="sf-label">Augmentation Template</div>
### Echo-Lattice Retina
<div class="sf-traits"><span class="sf-trait">Augmentation</span><span class="sf-trait">Tech</span></div>
**Installed in:** eyes. A translucent subretinal mesh highlights data that is about to change, creating a faint “afterimage from the future.” Use this block for cybernetics, biotech, magical implants, or hybrid modifications.
</div>

<div class="sf-band">Compact equipment reference</div>

<div class="sf-table sf-wide">

| Item | Level | Bulk | Primary use | Complication |
|:--|:--:|:--:|:--|:--|
| Nullglass visor | 3 | L | penetrate holographic clutter | bright magic creates false positives |
| Breach moths | 4 | L | disposable intrusion microdrones | leave a recognizable forensic signature |
| Forked-future beacon | 5 | L | probability preview | repeated use creates contradictory overlays |
| Drift anchor spike | 7 | 1 | stabilize local teleportation | broadcasts its location while active |
| Choir key | 8 | L | hybrid arcane/network authentication | requires a living voiceprint |

</div>

<div class="sf-art-slot-strip sf-wide">
  <div class="sf-art-placeholder" data-ratio="gear / object"></div>
  <div class="sf-art-placeholder" data-ratio="gear / object"></div>
  <div class="sf-art-placeholder" data-ratio="gear / object"></div>
</div>
<div class="sf-micro sf-wide">Optional object-art strip: weapons, augmentations, gadgets, vehicles, or relics. Replace each slot with a cropped image or transparent object render.</div>

## Availability language

<div class="sf-grid2">
<div class="sf-card"><div class="sf-label">Commercial</div>Available openly in major settlements. Price, licensing, and supply may still vary.</div>
<div class="sf-card"><div class="sf-label">Controlled</div>Requires faction access, legal authority, criminal contacts, or bespoke fabrication.</div>
<div class="sf-card"><div class="sf-label">Prototype</div>Unique engineering assumptions; failure should create story, not just lost credits.</div>
<div class="sf-card"><div class="sf-label">Artifact-Tech</div>The device violates normal technological expectations because magic, alien physics, or both are involved.</div>
</div>

<div class="sf-datapad">
<div class="sf-label">Authoring principle</div>
Starfinder gear becomes memorable when the **failure mode is as specific as the benefit**. “+1 to a check” belongs in mechanics; “leaves a ghost signal on every network it touches” belongs in the fiction.
</div>

\page

<div class="sf-page-tag">Worlds</div>
<div class="sf-headerline"><span class="sf-kicker">Astrographic File</span><span class="id">K9 // SYS 03</span></div>

# System & Location Dossiers

<div class="sf-system">
  <div class="sf-body star"></div><div class="sf-body one"></div><div class="sf-body two"></div><div class="sf-body three"></div>
  <div class="sf-maplabel" style="left:20%;top:29%">NIVEUS // MINING WORLD</div>
  <div class="sf-maplabel" style="right:12%;top:18%">ORCHID BELT</div>
  <div class="sf-maplabel" style="left:60%;bottom:7%">KESTREL-9 // RELAY</div>
  <div class="sf-maplabel" style="left:42%;top:55%">AUREL // K-TYPE</div>
</div>

<div class="sf-grid3 sf-wide">
<div class="sf-card"><div class="sf-label">Niveus</div><strong>Cold extraction world</strong><br>Thin ionosphere, deep subglacial settlements, aggressive contract law.</div>
<div class="sf-card"><div class="sf-label">Kestrel-9</div><strong>Abandoned relay</strong><br>Artificial atmosphere, standard gravity, causal anomalies.</div>
<div class="sf-card"><div class="sf-label">Orchid Belt</div><strong>Debris ecology</strong><br>Scrap habitats, scavenger clans, sensor echoes, hidden shrines.</div>
</div>

## Location dossier

<div class="sf-dossier">
### Kestrel-9 Relay
**Function:** predictive communications relay • **Status:** officially decommissioned  
**What everyone knows:** it was abandoned after major Drift disruptions.  
**What locals know:** salvagers sometimes receive replies before they transmit.  
**What is actually true:** its model is no longer predicting traffic. It is predicting **decisions**.
</div>

## Faction dossier

<div class="sf-dossier">
### Vantage Meridian
**Public face:** rescue logistics and remote infrastructure.  
**Real objective:** reacquire predictive models before regulators notice.  
**Resources:** tug ships, contractor marines, excellent forensic analysts, patient lawyers.  
**Leverage:** they own Kestrel-9 on paper.  
**Fracture:** Operations wants the relay intact; Legal wants it vaporized.
<div class="sf-meter"><span style="width:72%"></span></div>
<div class="sf-micro">Influence // local contracting network // 72%</div>
</div>

<div class="sf-warning sf-wide">
<div class="sf-label">Worldbuilding test</div>
For every location, give the GM **one environmental rule, one social pressure, one piece of useful infrastructure, and one thing that should not exist there**. That quartet generates play faster than another paragraph of history.
</div>

\page

<div class="sf-page-tag">Hacking</div>
<div class="sf-headerline"><span class="sf-kicker">Infiltration Topology</span><span class="id">K9 // NET 07</span></div>

# Network Encounter

<div class="sf-net">
  <div class="sf-line safe" style="left:24mm;top:23mm;width:66mm;transform:rotate(8deg)"></div>
  <div class="sf-line" style="left:84mm;top:31mm;width:50mm;transform:rotate(37deg)"></div>
  <div class="sf-line hot" style="left:128mm;top:60mm;width:50mm;transform:rotate(54deg)"></div>
  <div class="sf-line" style="left:24mm;top:23mm;width:73mm;transform:rotate(63deg)"></div>
  <div class="sf-line safe" style="left:58mm;top:79mm;width:58mm;transform:rotate(-14deg)"></div>
  <div class="sf-line hot" style="left:109mm;top:65mm;width:56mm;transform:rotate(143deg)"></div>
  <div class="sf-line" style="left:115mm;top:68mm;width:49mm;transform:rotate(16deg)"></div>

  <div class="sf-node" style="left:8mm;top:14mm">Dock Access<br><small>ENTRY // DC 18</small></div>
  <div class="sf-node" style="left:72mm;top:21mm">Relay Kernel<br><small>AUTH // DC 23</small></div>
  <div class="sf-node lock" style="right:11mm;top:45mm">Security Mesh<br><small>LOCK // DC 22</small></div>
  <div class="sf-node" style="left:32mm;bottom:14mm">Life Support<br><small>UTILITY // DC 20</small></div>
  <div class="sf-node core" style="left:91mm;bottom:25mm">Prediction Core<br><small>CORE // DC 24</small></div>
  <div class="sf-node core" style="right:10mm;bottom:8mm">Black Archive<br><small>SECRET // DC 26</small></div>
</div>

<div class="sf-grid3 sf-wide">
<div class="sf-card"><div class="sf-label">Cyan edge</div><strong>Trusted route.</strong><br>Crossing it does not itself increase alert.</div>
<div class="sf-card"><div class="sf-label">Gray edge</div><strong>Contested route.</strong><br>Failure creates a local complication.</div>
<div class="sf-card"><div class="sf-label">Magenta edge</div><strong>Alert route.</strong><br>Crossing unsecured advances the clock.</div>
</div>

## Run each node with four facts

<div class="sf-table">

| Node datum | Question it answers |
|:--|:--|
| Access | what must be controlled first? |
| Check | what skill / approach can breach it? |
| Prize | what becomes possible after success? |
| Countermeasure | what changes after failure? |

</div>

<div class="sf-warning">
<div class="sf-label">Alert State</div>
<div class="sf-clock"><span class="on">Quiet</span><span class="on">Observed</span><span>Hostile</span><span class="hot">Burned</span></div>
A network map should create **choices of route**, not merely a sequence of checks. Give at least one risky shortcut and one safe route that costs time or another resource.
</div>

\page

<div class="sf-page-tag">Starships</div>
<div class="sf-headerline"><span class="sf-kicker">Cinematic Scene</span><span class="id">K9 // SHIP 09</span></div>

# Starship Scene Toolkit

<div class="sf-ship">
  <div class="sf-silhouette"></div>
  <div class="readout">Vessel: Meridian Tug 6<br>Range: 8,400 km<br>Approach: intercept<br>IFF: commercial</div>
  <div class="readout right">Crew: 14<br>Drive: hot<br>Weapons: armed<br>Intent: recover asset</div>
</div>

<div class="sf-phase sf-wide">
<div><b>1 // Establish</b>What is the ship trying to accomplish besides “win combat”?</div>
<div><b>2 // Approach</b>Who controls range, angle, terrain, or access?</div>
<div><b>3 // Crisis</b>Put one ship system, passenger, or objective at risk.</div>
<div><b>4 // Reversal</b>Reveal reinforcements, damage, betrayal, or an anomaly.</div>
<div><b>5 // Resolution</b>Escape, capture, disable, bargain, rescue, or destroy.</div>
</div>

## Crew-facing objectives

<div class="sf-grid2">
<div class="sf-card"><div class="sf-label">Pilot</div><strong>Thread the Orchid Belt.</strong><br>Create a route large ships cannot safely follow.</div>
<div class="sf-card"><div class="sf-label">Engineer</div><strong>Hold the damaged field together.</strong><br>Trade heat, power, or another resource for time.</div>
<div class="sf-card"><div class="sf-label">Gunner</div><strong>Change the enemy’s options.</strong><br>Target propulsion, sensors, weapons, or a pursuit asset.</div>
<div class="sf-card"><div class="sf-label">Operator / Mystic</div><strong>Fight the information war.</strong><br>Jam, deceive, divine, hack, or exploit an anomalous signal.</div>
</div>

## Complication table

<div class="sf-table">

| d6 | Complication |
|:--:|:--|
| 1 | debris behaves as though influenced by a gravity source that is not present |
| 2 | the relay predicts the enemy captain’s next transmission word for word |
| 3 | civilian traffic enters the engagement envelope |
| 4 | a disabled vessel still broadcasts perfect telemetry |
| 5 | a Drift anomaly duplicates one ship’s sensor signature |
| 6 | someone aboard the opposing ship is trying to defect |

</div>

<div class="sf-datapad">
<div class="sf-label">Design note</div>
The page treats a starship sequence as a **cinematic objective machine**: establish stakes, give every role something consequential to do, and make the battle alter the larger mission.
</div>

\page

<div class="sf-page-tag">Subsystems</div>
<div class="sf-headerline"><span class="sf-kicker">Progress Structures</span><span class="id">K9 // SUB 11</span></div>

# Research & Chase Toolkit

## Research track

<div class="sf-panel">
<div class="sf-label">Question // Who built the impossible forecasts?</div>
<div class="sf-track"><span class="done"></span><span class="done"></span><span class="done"></span><span></span><span></span><span class="risk"></span><span></span><span></span></div>
**Threshold 2:** the relay trained on ordinary traffic.  
**Threshold 4:** its best predictions started after the Drift Crisis.  
**Threshold 6:** the “training data” includes messages never transmitted.  
**Threshold 8:** the model contains decision traces belonging to the crew.
</div>

<div class="sf-grid2">
<div class="sf-card"><div class="sf-label">Useful research site</div>Destroyed archive, xenobiology lab, legal registry, cult reliquary, corporate model repository.</div>
<div class="sf-card"><div class="sf-label">Useful consequence</div>Time lost, source alerted, partial truth, dangerous access, evidence that implicates an ally.</div>
</div>

<div class="sf-band">Chase as moving geography</div>

<div class="sf-chase sf-wide">
<div><b>1 Dock</b>mag clamps fail</div>
<div><b>2 Spine</b>vertical drop</div>
<div><b>3 Habitat</b>panicked scavengers</div>
<div><b>4 Array</b>open vacuum</div>
<div><b>5 Gantry</b>corporate boarding team</div>
<div><b>6 Cutter</b>departure window</div>
</div>

## Chase design

<div class="sf-table">

| Each zone needs | Example |
|:--|:--|
| Obstacle | ruptured pressure door |
| Alternate approach | bypass through maintenance ducts |
| Cost of failure | lose distance **and** expose gear to vacuum |
| Local image | prayer ribbons frozen in vented air |
| Exit condition | reach the next zone before the lock seals |

</div>

<div class="sf-warning">
<div class="sf-label">Do not make every obstacle a skill-tax</div>
At least one zone should pose a **decision rather than a check**: save someone, abandon equipment, reveal a secret route, accept help, or allow the quarry to gain ground.
</div>

<div class="sf-transmission">
<div class="sf-label">Research payoff // recovered packet</div>
“You keep calling it prediction. That word lets you pretend causality only travels one direction.”
</div>

\page

<div class="sf-page-tag">Options</div>
<div class="sf-headerline"><span class="sf-kicker">Player-Facing Content</span><span class="id">K9 // PC 06</span></div>

# Character Option Templates

<div class="sf-live-feature sf-wide">
<div class="sf-live-feature-copy">

<div class="sf-stat">
<div class="level">Feat 6</div>
<div class="name">Ghost in the Telemetry</div>
<div class="sf-traits"><span class="sf-trait">Skill</span><span class="sf-trait">General</span><span class="sf-trait rare">Computers</span></div>
<div class="sf-rule"></div>
<p><strong>Prerequisite</strong> appropriate proficiency in Computers</p>
<p>You can hide your activity inside the statistical noise of large systems. On a strong success while compromising a network, you can leave behind a plausible false user trail rather than merely concealing your own.</p>
</div>

<div class="sf-dossier">
### Relay Salvager
You grew up stripping obsolete repeaters, failed gates, and abandoned comm buoys for valuable components. You learned that the dangerous part was rarely the hardware. It was the messages people thought were gone.

**Author fields:** attribute boosts • trained skill • Lore • skill feat • one sentence explaining why this background creates adventures.
</div>

</div>
<div class="sf-live-feature-art">
<a href="https://cdn.paizo.com/blog/meet-the-iconics-dae"><img src="https://cdn.paizo.com/a7d62ac8-7f03-00ef-f1f0-83fb8bf332e2/71be1220-41f2-4809-afe0-b20cda028927/dae_solarian_1300x2000.png?w=900" alt="Dae, the iconic pahtra solarian"></a>
<div class="sf-paizo-credit"><b>Dae, iconic solarian</b> • art by Kent Hamilton • © Paizo Inc. • <a href="https://cdn.paizo.com/blog/meet-the-iconics-dae">Paizo source / credit</a></div>
</div>
</div>

<div class="sf-band">Ability block</div>

<div class="sf-panel sf-wide">
<div class="sf-label">Two-action ability template</div>
### Split-Spectrum Step <span class="sf-action"><span>2</span></span>
<div class="sf-traits"><span class="sf-trait">Teleportation</span><span class="sf-trait">Magical</span></div>
**Frequency** author-defined  
State the action’s **new tactical possibility first**. Put trigger restrictions, range, targeting, and edge cases after the main effect. If a reader cannot determine “why would I use this?” in one sentence, rewrite.
</div>

<div class="sf-grid4 sf-wide">
<div class="sf-card"><div class="sf-label">Class feature</div>Lead with action economy and combat role; follow with scaling and exceptions.</div>
<div class="sf-card"><div class="sf-label">Spell</div>Make range, targets, duration, save, and degrees of success visually scannable.</div>
<div class="sf-card"><div class="sf-label">Augmentation</div>State body slot / installation assumptions, then benefit and unusual failure mode.</div>
<div class="sf-card"><div class="sf-label">Background</div>Connect mechanics to contacts, obligations, knowledge, or trouble.</div>
</div>

<div class="sf-datapad sf-wide">
<div class="sf-label">Editorial test</div>
A Starfinder option should usually imply **what it looks like in the fiction**. Technology, magic, biology, culture, and alien physics are not separate decorative layers; the fun often lives where they collide.
</div>

\page

<div class="sf-page-tag">Art</div>
<div class="sf-headerline"><span class="sf-kicker">Art Direction Toolkit</span><span class="id">K9 // VIS 14</span></div>

# Official Art in Situ

Current Starfinder 2e pages let illustration control substantial page territory. The practical lesson is simple: **do not shrink strong character art into a postage stamp just to preserve a rigid two-column flow.** Give it a deliberate editorial role.

<div class="sf-official-art-demo v6">
<figure>
<a href="https://cdn.paizo.com/blog/meet-the-iconics-dae"><img src="https://cdn.paizo.com/a7d62ac8-7f03-00ef-f1f0-83fb8bf332e2/71be1220-41f2-4809-afe0-b20cda028927/dae_solarian_1300x2000.png?w=900" alt="Dae, iconic pahtra solarian"></a>
<figcaption><b>DAE // SOLARIAN</b><br>Transparent full-body spot art. Art by Kent Hamilton. © Paizo Inc. <a href="https://cdn.paizo.com/blog/meet-the-iconics-dae">Paizo source</a></figcaption>
</figure>
<figure>
<a href="https://cdn.paizo.com/blog/meet-the-iconics-chk-chk"><img src="https://cdn.paizo.com/a7d62ac8-7f03-00ef-f1f0-83fb8bf332e2/a13a5b52-11a9-4f20-a80e-594a3bb8f36f/Starfinder_V2Iconic_ChkChk_1546x2000.png?w=900" alt="Chk Chk, iconic shirren mystic"></a>
<figcaption><b>CHK CHK // MYSTIC</b><br>Transparent full-body spot art. Art by Kent Hamilton. © Paizo Inc. <a href="https://cdn.paizo.com/blog/meet-the-iconics-chk-chk">Paizo source</a></figcaption>
</figure>
</div>

<div class="sf-grid2 sf-wide">
<div class="sf-card"><div class="sf-label">Official reusable package</div>[Paizo Community Use Package](https://paizo.com/licenses/communityuse/package) includes the current six-character SF2e iconic hero package, plus older Starfinder maps, organization symbols, religious symbols, and other assets.</div>
<div class="sf-card"><div class="sf-label">Free layout references</div>[Starfinder Second Edition Free Resources](https://paizo.com/starfinder/2e/freeresources) provides current pregens and free adventures useful both at the table and as examples of official presentation.</div>
</div>

<div class="sf-warning sf-wide">
<div class="sf-label">Production advice</div>
The live CDN images here make the Homebrewery demo immediately testable. For a durable release, download art that Paizo actually makes available under the publishing route you are using, retain required credits, and host the permitted file somewhere you control. A visible image URL is not by itself permission to reuse an image.
</div>

<div class="sf-datapad sf-wide">
<div class="sf-label">What the screenshot taught us</div>
A technically successful image is not necessarily a successful layout. The previous Dae example rendered correctly but became **too small because it floated inside Homebrewery's column flow**. The <code>.sf-live-feature</code> pattern spans the page and gives the illustration roughly the same visual authority as the rules content beside it. In v7, recipe markup is HTML-escaped so examples display as copyable code instead of accidentally rendering broken images.
</div>

\page

<div class="sf-page-tag">Art</div>
<div class="sf-headerline"><span class="sf-kicker">Art Placement Recipes</span><span class="id">K9 // VIS 15</span></div>

# Art Placement Recipes I

<div class="sf-recipe-grid">
<div class="sf-recipe">
### 1 // Wide cinematic banner
Use near the top of an adventure scene, location, class, ancestry, or chapter page. It crops without distortion and allows focal-point control.

<div class="sf-codeblock">&lt;div class=&quot;sf-art-banner&quot; style=&quot;--focus-x:70%;--focus-y:35%&quot;&gt;&lt;img src=&quot;IMAGE-URL&quot; alt=&quot;Description&quot;&gt;&lt;div class=&quot;sf-art-caption&quot;&gt;Caption&lt;/div&gt;&lt;/div&gt;</div>
</div>

<div class="sf-recipe magenta">
### 2 // Transparent cutout
Best for creatures or characters beside rules. Transparent PNG/WebP recommended.

<div class="sf-codeblock magenta">&lt;div class=&quot;sf-cutout-right&quot;&gt;&lt;img src=&quot;PNG-URL&quot; alt=&quot;...&quot;&gt;&lt;/div&gt;</div>

Use the left variant when the art should anchor the opposite page edge.
</div>

<div class="sf-recipe purple">
### 3 // Map or deck plan
Maps should preserve **all** tactical information rather than crop for aesthetics.

<div class="sf-codeblock purple">&lt;div class=&quot;sf-map-frame&quot;&gt;&lt;img src=&quot;MAP-URL&quot; alt=&quot;Map description&quot;&gt;&lt;div class=&quot;sf-art-credit&quot;&gt;Map by ...&lt;/div&gt;&lt;/div&gt;</div>
</div>

<div class="sf-recipe">
### 4 // Chapter opener
Use when the illustration defines the identity of a section rather than merely decorating it.

<div class="sf-codeblock">&lt;div class=&quot;sf-art-opener&quot; style=&quot;--sf-opener-art:url('IMAGE-URL')&quot;&gt; ... &lt;/div&gt;</div>
</div>
</div>

<div class="sf-art-placeholder sf-art-slot-wide" data-ratio="wide scene // 2.4:1"></div>
<div class="sf-micro sf-wide">A real page can reserve this zone while drafting, then replace it with <code>.sf-art-banner</code> without changing the surrounding structure.</div>

<div class="sf-grid2 sf-wide">
<div class="sf-card"><div class="sf-label">Focal point</div>Change <code>--focus-x</code> and <code>--focus-y</code> to reposition a crop without distorting the source image.</div>
<div class="sf-card"><div class="sf-label">Accessibility</div>Keep meaningful <code>alt</code> text in source. Decorative art can use an empty alt string.</div>
</div>

<div class="sf-warning sf-wide"><div class="sf-label">Avoid the thumbnail trap</div>
If important art is reduced until the viewer cannot read gesture, costume, expression, silhouette, or environment, it is no longer doing the editorial work that justified including it. Either enlarge it or omit it.
</div>

\page

<div class="sf-page-tag">Art</div>
<div class="sf-headerline"><span class="sf-kicker">Art Placement Recipes</span><span class="id">K9 // VIS 16</span></div>

# Art Placement Recipes II

<div class="sf-recipe-grid">
<div class="sf-recipe magenta">
### 5 // Half-page plate
One of the strongest published-book patterns: let a major illustration own a large part of the page, then use a compact adjacent text block.

<div class="sf-codeblock magenta">&lt;div class=&quot;sf-art-half&quot;&gt;&lt;img src=&quot;IMAGE-URL&quot; alt=&quot;...&quot;&gt;&lt;div class=&quot;sf-art-caption&quot;&gt;Scene caption&lt;/div&gt;&lt;/div&gt;</div>
</div>

<div class="sf-recipe purple">
### 6 // Full-page art plate
Use for chapter punctuation, locations, major NPC reveals, or high-value scene-setting.

<div class="sf-codeblock purple">&lt;div class=&quot;sf-art-plate&quot;&gt;&lt;img src=&quot;IMAGE-URL&quot; alt=&quot;...&quot;&gt;&lt;div class=&quot;sf-overlay&quot;&gt;&lt;h2&gt;Section title&lt;/h2&gt;Short intro.&lt;/div&gt;&lt;/div&gt;</div>
</div>

<div class="sf-recipe">
### 7 // Inset feature art
Use for a faction headquarters, city, vehicle, NPC scene, or equipment image while prose wraps naturally beside it.

<div class="sf-codeblock">&lt;div class=&quot;sf-art-feature-right&quot;&gt;&lt;img src=&quot;IMAGE-URL&quot; alt=&quot;...&quot;&gt;&lt;/div&gt;</div>
</div>

<div class="sf-recipe magenta">
### 8 // Outer-edge / spot art
Use transparent character or environment art to interrupt the page boundary rather than confining everything to rectangles.

<div class="sf-codeblock magenta">&lt;div class=&quot;sf-spot-art-right&quot;&gt;&lt;img src=&quot;TRANSPARENT-PNG&quot; alt=&quot;...&quot;&gt;&lt;/div&gt;</div>
</div>
</div>

<div class="sf-grid2 sf-wide">
<div class="sf-card"><div class="sf-label">Use large art when…</div>the image establishes a location, species, character, technology, mood, or narrative beat that prose alone would communicate poorly.</div>
<div class="sf-card"><div class="sf-label">Use small art when…</div>the object is primarily identificatory: a device, insignia, weapon, portrait, interface icon, or quick visual reference.</div>
<div class="sf-card"><div class="sf-label">Use no art when…</div>the page is a dense rules reference and illustration would displace information the reader needs to compare quickly.</div>
<div class="sf-card"><div class="sf-label">Use a placeholder when…</div>you are drafting page rhythm before commissioning, choosing, or licensing the final illustration.</div>
</div>

<div class="sf-warning sf-wide"><div class="sf-label">Art handling</div>
When a license permits cropping but not other alteration, use CSS focal-point positioning rather than baking edits into the source. Keep source, artist, permission route, and required credit together in your project notes.
</div>

<div class="sf-datapad sf-wide"><div class="sf-label">Layout principle</div>
Published-looking pages do not need more decoration. They need **hierarchy, varied scale, and controlled interruption**: quiet reading fields, a few strong information bars, and occasional art large enough to change the rhythm of the spread.
</div>

\page

<div class="sf-page-tag">Toolkit</div>
<div class="sf-headerline"><span class="sf-kicker">Component Catalog</span><span class="id">K9 // UI 99</span></div>

# Copy-Paste Component Index

<div class="sf-grid3 sf-wide">
<div class="sf-swatch"><b>Mission brief</b><code>.sf-mission</code><br>Hook, assignment, scenario premise.</div>
<div class="sf-swatch"><b>Terminal</b><code>.sf-datapad</code><br>Diegetic system output or GM scratch channel.</div>
<div class="sf-swatch"><b>Warning</b><code>.sf-warning</code><br>Hazard, caution, complication.</div>
<div class="sf-swatch"><b>Transmission</b><code>.sf-transmission</code><br>Comms, dialogue, recovered message.</div>
<div class="sf-swatch"><b>Dossier</b><code>.sf-dossier</code><br>Faction, location, NPC, organization.</div>
<div class="sf-swatch"><b>Stat block</b><code>.sf-stat</code><br>Creature, item, feat, spell, ability.</div>
<div class="sf-swatch"><b>Trait</b><code>.sf-trait</code><br>Rules labels and rarity tags.</div>
<div class="sf-swatch"><b>Meter</b><code>.sf-meter</code><br>Influence, progress, reputation, heat.</div>
<div class="sf-swatch"><b>Clock</b><code>.sf-clock</code><br>Escalation and alert states.</div>
<div class="sf-swatch"><b>Network</b><code>.sf-net / .sf-node</code><br>Hacking routes, permissions, dependencies.</div>
<div class="sf-swatch"><b>System map</b><code>.sf-system</code><br>Schematic astrography, not decorative art.</div>
<div class="sf-swatch"><b>Starship scene</b><code>.sf-ship / .sf-phase</code><br>Cinematic starship objectives.</div>
</div>

<div class="sf-band">Design grammar</div>

<div class="sf-grid2">
<div class="sf-panel"><div class="sf-label">Technology</div>Angular panels, grids, route maps, diagnostic typography, cyan structural lines.</div>
<div class="sf-panel"><div class="sf-label">Magic</div>Violet/magenta interruptions, circular sigils, impossible readings, asymmetry.</div>
<div class="sf-panel"><div class="sf-label">World</div>Dossiers, maps, factions, social leverage, environment rules.</div>
<div class="sf-panel"><div class="sf-label">Action</div>Tracks, clocks, phase cards, routes, consequences. The page should help run play.</div>
</div>

## Page-building rule

<div class="sf-warning">
<div class="sf-label">The anti–Old Gods rule</div>
Do not add a panel merely because it looks thematic. Every recurring visual form should answer a recurring authoring or table-use problem. If a component cannot explain what information it makes easier to **write, find, compare, or run**, delete it.
</div>

<div class="sf-datapad">
<div class="sf-label">Toolkit status // v6</div>
**Self-contained CSS plus two live Paizo-hosted art demonstrations, now shown at publication-scale rather than thumbnail-scale.** Major diagrams span the full page. Published-book alignment revised: white reading field, cyan/navy information hierarchy, purple-magenta edge navigation, faceted geometry, and integrated art zones. Sample pages demonstrate mission structure, creature/hazard presentation, equipment, astrography, hacking infiltration, cinematic starships, research, chases, and player options.
</div>

### Publishing lanes
This toolkit deliberately gets close to the **visual vocabulary** of current Starfinder 2e books without being a page-for-page clone. For private/home use, use whatever art you have rights to. For public release, pick the Paizo publishing route that actually fits your project: **Starfinder Infinite** for setting/IP-heavy community products, **Community Use** for qualifying free fan projects, or the **Compatibility License + ORC** for compatible third-party material. The Compatibility License specifically forbids confusingly similar Paizo trade dress, so an exact facsimile is not a safe target for that route. For Paizo-supplied reusable art, begin with the [Community Use Package](https://paizo.com/licenses/communityuse/package) and read the [Fan Content Policy](https://paizo.com/licenses/fancontent) before release.