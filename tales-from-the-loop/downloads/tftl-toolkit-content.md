<!-- TFTL TOOLKIT v4 — COPY AND EDIT
Clone with Source > Clone to New. Keep the Style Editor and V3 renderer.
Every page is independent. Copy a whole page or individual {{blocks}}, then replace bracketed fields.
The \page command (a backslash followed by page) starts the next sheet; text does not auto-paginate.
The folio and orange-rail number are automatic CSS counters. Do not type numbers into them.
Keep all container closing }}. Copy example pages you need, then remove unused pages and instructions.
For an actual image, replace the words INSIDE imageSlot with Markdown: ![Description](PUBLIC_IMAGE_URL)
Keep figure, imageSlot and caption wrappers. Use imageCover only if you want cropping.
Original inspired styling, no official logo, artwork, or rules text included.
-->
{{rail
{{railLabel TOOLKIT}}
{{railNumber &nbsp;}}
{{railCode TFTL}}
{{railVertical TALES FROM THE LOOP / [YOUR CAMPAIGN]}}
}}

{{masthead
{{kicker AN UNOFFICIAL HOMEBREWERY FORMATTING TOOLKIT}}
# YOUR CAMPAIGN<br>STARTS HERE
{{dek A reusable page system for stories, reference material,<br>characters, handouts, and illustrations.}}
}}

{{metadata
**FORMAT** V3 &nbsp; / &nbsp; **PAGES** Copy as needed &nbsp; / &nbsp; **STYLE** Orange / charcoal / warm paper
}}

{{loopGrid
{{loopColumn
## Start with a copy
1. Choose **Source → Clone to New**.
2. Replace the **[bracketed fields]** in Brew Editor.
3. Rename the brew in Properties and save it.
4. Keep your edit link; give readers the share link.

The Style Editor supplies the common appearance. You can leave it unchanged while editing your content.

{{callout
### The page model
Copy a complete sheet, including its rail and footer. Separate sheets with a page break. Page numbers update automatically.

Split long sections yourself. Check the preview before sharing.
}}

## Choose a page pattern
| Page | What it contains |
|:---|:---|
| 02 | A fill-in mystery |
| 03 | Six heading levels and text styles |
| 04 | Callouts, tables, lists, and timelines |
| 05 | Kid, NPC, machine, and location cards |
| 06 | Wide, portrait, and wrapped image layouts |
| 07 | A continuation page with mixed widths |
| 08 | An editable clue-flow map |
| 09 | A title-page template |
| 10 | Eight fictional organization logos |

## Keep what you need
[Your campaign overview. Remove unused examples. Move page 09 to the front for a title page.]
}}
{{loopColumn
## Copy components
Copy a complete **callout**, **readAloud**, **flavor**, **statCard**, **figure**, **splitBand**, or **clueFlow**, including its closing braces.

{{terminal
### Small syntax reference
<pre><code># TITLE
## SECTION
### SUBSECTION
**bold** / *italic*
PAGE BREAK: backslash + page</code></pre>
}}

## Add another sheet
Copy page 07 from its rail to its footer. Separate sheets with:

<pre><code>\page</code></pre>

For two columns, keep two **loopColumn** blocks inside a **loopGrid**. For material spanning both columns, place it before or after that grid.

## Add an image later
The image page uses empty frames. Replace the words inside an **imageSlot** with:

<pre><code>![Description](PUBLIC_IMAGE_URL)</code></pre>

Use a public image URL and credit the artist. The default fits the whole image; **imageCover** crops it.

{{callout,sideNote
### Before sharing
Check every page. Move crowded text to another sheet. Replace labels and credits; remove unused examples.
}}
}}
}}

{{footer
{{footerText [YOUR NAME] · UNOFFICIAL TALES FROM THE LOOP MATERIAL}}
{{folio &nbsp;}}
}}

\page

{{rail
{{railLabel MYSTERY}}
{{railNumber &nbsp;}}
{{railCode [ID]}}
{{railVertical [PLACE / YEAR / SEASON]}}
}}

{{masthead
{{kicker AN ORIGINAL MYSTERY FOR TALES FROM THE LOOP}}
# [TITLE LINE ONE]<br>[TITLE LINE TWO]
{{dek [Your premise in one or two short sentences.<br>What ordinary thing has become strange?]}}
}}

{{metadata
**WHEN** [Year / season] &nbsp; / &nbsp; **WHERE** [Place] &nbsp; / &nbsp; **PLAY** [Kids / duration]
}}

{{loopGrid,mysteryCompact
{{loopColumn
## The opening scene
[Interrupt an ordinary day. Why do the Kids care? What can they investigate?]

**Ask the players:** [A question about the Kids' relationships, fears, or possessions.]

{{truth
### The truth / GM only
[The real cause. What does the person, machine, or creature want?]

**If nobody intervenes:** [The consequence and its deadline.]
}}

## Follow the clues
[How the Kids find essential information. Risky actions invite rolls and complications.]

### 01 / [First location]
**Notice:** [Two sensory details.]<br>
**Clue:** [Information leading somewhere useful.]<br>
**Trouble:** [Skill / obstacle.]<br>
**Failure:** [A complication that keeps play moving.]

### 02 / [Second location]
**Notice:** [Two sensory details.]<br>
**Clue:** [Evidence revealing the cause.]<br>
**Trouble:** [Skill / obstacle.]<br>
**Failure:** [A new problem or cost.]

### 03 / [The final location]
[The discovery and decision. Connect this site to the person or machine opposite.]

## Back to everyday life
[Show what changes in a family, school, friendship, or Hideout scene.]

**Closing question:** [What do the Kids now think or feel differently?]

{{truth
### A useful detail
[Equipment, machine behavior, location detail, or GM reminder.]
}}
}}

{{loopColumn
{{terminal
### [Handout / recovered message]
DOCUMENT: [NAME OR NUMBER]<br>
DATE: [YEAR / MONTH / DAY]<br>
STATUS: [AN UNSETTLING DETAIL]<br>
[One short clue in the document's voice.]
}}

## [Character / key person]
**Name:** [Name] · **Age:** [Age]<br>
**Role / Type:** [Description]<br>
**Drive:** [What they want]<br>
**Problem:** [What gets in the way]<br>
**Relationship:** [Their connection to the Kids]

{{ratings
### Optional Kid ratings
| Body | Tech | Heart | Mind |
|:----:|:----:|:-----:|:----:|
| [#] | [#] | [#] | [#] |

**Skills:** [Skill / rating; skill / rating]<br>
**Iconic item:** [Item / bonus]<br>
**Anchor / Pride:** [Your notes]
}}

[For an NPC, use a motivation, secret, and something they offer the Kids.]

## Pressure from everyday life
**[Time / beat 1] /** [A mundane obligation interrupts the investigation.]

**[Time / beat 2] /** [The strange situation escalates.]

**[Time / beat 3] /** [The approaching deadline becomes unmistakable.]

## Choices and consequences
**[Approach A].** [Action, outcome, and any Trouble roll.]

**[Approach B].** [Another solution and its tradeoff.]

**If things go wrong:** [A setback, changed relationship, or Condition following from the fiction.]
}}
}}

{{footer
{{footerText [YOUR NAME] · ORIGINAL UNOFFICIAL TALES FROM THE LOOP MATERIAL}}
{{folio &nbsp;}}
}}

\page

{{rail
{{railLabel TOOLKIT}}
{{railNumber &nbsp;}}
{{railCode TFTL}}
{{railVertical TALES FROM THE LOOP / [YOUR CAMPAIGN]}}
}}

{{masthead
{{kicker AN UNOFFICIAL HOMEBREWERY FORMATTING TOOLKIT}}
# TYPE & VOICE
{{dek A consistent hierarchy for headings, body text,<br>quotations, narration, and small reference notes.}}
}}

{{loopGrid
{{loopColumn
## Heading level two
Use **##** for a location, chapter topic, or mystery phase.

### Heading level three
Use **###** for a scene, subtopic, or card title.

#### Heading level four
Use **####** for a small topic within a section.

##### Heading level five
Use **#####** for a compact reference label.

###### Heading level six
Use **######** for the lowest level of annotation.

## Ordinary body text
{{prose
[The first paragraph starts flush left. Crimson Text gives story prose a readable, book-like rhythm.]

[Later paragraphs indent. Use this prose container for continuous narrative; ordinary reference paragraphs retain their spacing.]
}}

Use **bold** for labels, *italic* for emphasis, and ~~strikethrough~~ for a redacted detail. Use an HTML break tag for an explicit line break.

{{lead
[A short summary can use lead for slightly larger text. An italic preamble introduces the scene.]
}}

{{smallText
[A small credit or cross-reference. Keep essential information in body text.]
}}

{{eyebrow [A small section label]}}
#### [The title it introduces]
[This combination gives you another way to group reference information.]
}}
{{loopColumn
{{preamble
[Use this italic preamble for an introduction.]
}}

{{skill INVESTIGATE}}

## Flavor text
{{flavor
[The service lights blink beneath the lake. Somewhere on the other shore, a telephone rings in an empty house.]

{{attribution [Speaker / diary / date]}}
}}

## Read-aloud narration
{{callout,readAloud
### What the Kids notice
[The classroom smells of wet coats and hot dust. A robot stands beside the blackboard, carefully erasing a name none of you remembers writing.]
}}

## A simple quotation
> [“It only does what we asked. I think we asked the wrong question.”]
>
> — [Name or source]

## Technical text
An inline code label such as <code>UNIT L–17</code> suits a machine identifier. A code block preserves a log, transcript, or short schematic description:

<pre><code>[17:41] INPUT RECEIVED
[17:42] OWNER NOT FOUND
[17:43] RETRY SCHEDULED</code></pre>

## Separators and links
[Put related information above a thin rule.]

---

[Start the next topic below it. Link syntax is shown in a source comment.]
<!-- Link example: [Link label](https://example.com) -->

{{callout,sideNote
### Type without clutter
The page title is level one. Levels two and three suit short mysteries; smaller headings support dense references.
}}
}}
}}

{{footer
{{footerText [YOUR NAME] · UNOFFICIAL TALES FROM THE LOOP MATERIAL}}
{{folio &nbsp;}}
}}

\page

{{rail
{{railLabel TOOLKIT}}
{{railNumber &nbsp;}}
{{railCode TFTL}}
{{railVertical TALES FROM THE LOOP / [YOUR CAMPAIGN]}}
}}

{{masthead
{{kicker AN UNOFFICIAL HOMEBREWERY FORMATTING TOOLKIT}}
# BOXES & TABLES
{{dek Reusable emphasis, instructions, lists, timelines,<br>and full-width reference sections.}}
}}

{{loopGrid
{{loopColumn
{{callout
### Standard callout
[A general note, optional rule, useful fact, or equipment detail. This is the basic black-header / peach-body box.]
}}

{{callout,readAloud
### Read aloud
[Text intended to be spoken to players. The softer background and italic body distinguish it from GM information.]
}}

{{callout,warning
### Deadline / urgent detail
[State the concrete event that demands attention. Use the orange header sparingly.]
}}

{{callout,sideNote
### Sidebar / reference note
[A smaller sans-serif box for commentary, guidance, or a cross-reference.]
}}

{{callout,handout
### In-world handout
[Sender / date / subject]

[Write a letter, memo, recovered note, or announcement. Dashed rules make this feel like a document within the page.]
}}
}}
{{loopColumn
{{truth
### GM secret
[Use this box for the hidden cause, an NPC's real objective, or consequences the Kids have not discovered.]
}}

{{terminal
### Machine log / transmission
UNIT: [IDENTIFIER]<br>
MODE: [CURRENT STATE]<br>
NEXT EVENT: [TIME]<br>
[One short line of recorded information.]
}}

## Lists
- [First item, clue, or piece of equipment.]
- [Second item.]
- [Third item.]

1. [First action or procedure.]
2. [Next action.]
3. [Final action.]

## A compact table
| [Roll] | [Result / detail] |
|:---:|:---|
| 1–2 | [An ordinary detail turns strange.] |
| 3–4 | [Someone needs the Kids' help.] |
| 5–6 | [A machine changes its behavior.] |

## A scene timeline
**[16:00] /** [First warning.]<br>
**[17:00] /** [The situation escalates.]<br>
**[18:00] /** [The deadline arrives.]
}}
}}

{{wideSection
## A table across the whole page
| [Location] | [Essential clue] | [Trouble / complication] |
|:---|:---|:---|
| [School] | [Where the trail starts.] | [An adult intervenes.] |
| [Service road] | [What caused the anomaly.] | [Time or equipment is lost.] |
| [Loop annex] | [How it can be resolved.] | [A difficult choice.] |
}}

{{footer
{{footerText [YOUR NAME] · UNOFFICIAL TALES FROM THE LOOP MATERIAL}}
{{folio &nbsp;}}
}}

\page

{{rail
{{railLabel TOOLKIT}}
{{railNumber &nbsp;}}
{{railCode TFTL}}
{{railVertical TALES FROM THE LOOP / [YOUR CAMPAIGN]}}
}}

{{masthead
{{kicker AN UNOFFICIAL HOMEBREWERY FORMATTING TOOLKIT}}
# PEOPLE & MACHINES
{{dek Flexible reference cards for Kids, NPCs, locations,<br>equipment, and the strange things near the Loop.}}
}}

{{loopGrid
{{loopColumn
{{statCard
### [Kid name] / [Type]
**Age:** [Age] · **Drive:** [Motivation]<br>
**Problem:** [Everyday complication]<br>
**Iconic item:** [Item / applicable bonus]

| Body | Tech | Heart | Mind |
|:---:|:---:|:---:|:---:|
| [#] | [#] | [#] | [#] |

**Skills:** [Name / rating; name / rating]<br>
**Luck / experience:** [Current values]

{{ruleLine
**Anchor:** [Person]<br>
**Pride:** [Statement]<br>
**Relationships:** [Names / notes]
}}

{{conditionLine
**Conditions:** □ [Condition] · □ [Condition]<br>
□ [Condition] · □ [Condition] · □ Broken
}}
}}

{{statCard
### [NPC name] / [Role]
**Appearance:** [A memorable detail]<br>
**Wants:** [A concrete objective]<br>
**Fear / secret:** [Hidden motivation]

#### What they offer
[Information, access, help, or a complication.]

#### Trouble involving them
[Skill / situation / result. Use descriptive notes instead of inventing a D&D combat stat block.]

**Voice:** [A short phrase or mannerism.]
}}

{{smallText
The fields are placeholders. Use your edition's character-creation and Trouble rules for actual ratings and mechanics. Delete any fields that do not apply.
}}
}}
{{loopColumn
{{statCard
### [Machine / creature]
**Designation:** [Name / model]<br>
**Appearance:** [Scale, movement, sound]<br>
**Purpose:** [Original function]<br>
**Current behavior:** [What has gone wrong]

#### Capabilities
[What it can do in the fiction.]

#### Limit / vulnerability
[What the Kids can discover and exploit.]

{{ruleLine
**Trouble:** [Action / skill / stakes]<br>
**Success:** [Concrete outcome]<br>
**Failure:** [Complication or Condition]
}}
}}

{{statCard
### [Location / facility]
**Mood:** [Three sensory details]<br>
**Access:** [Route / key / obstacle]<br>
**People:** [Who is here]

**Essential clue:** [What the Kids learn.]<br>
**Risk:** [What makes the scene difficult.]<br>
**Exit / next lead:** [Where play goes next.]
}}

{{statCard
### [Equipment / strange object]
**Looks like:** [Description]<br>
**Does:** [Function]<br>
**Cost / limit:** [Constraint]<br>
**Game effect:** [Relevant rule or your ruling]

[Include a bonus only when the rules or your chosen house rule justify one.]
}}
}}
}}

{{footer
{{footerText [YOUR NAME] · UNOFFICIAL TALES FROM THE LOOP MATERIAL}}
{{folio &nbsp;}}
}}

\page

{{rail
{{railLabel TOOLKIT}}
{{railNumber &nbsp;}}
{{railCode TFTL}}
{{railVertical TALES FROM THE LOOP / [YOUR CAMPAIGN]}}
}}

{{masthead
{{kicker AN UNOFFICIAL HOMEBREWERY FORMATTING TOOLKIT}}
# PICTURES & SPACE
{{dek Prepared image frames and captions.<br>Replace a placeholder only when you have an image URL.}}
}}

<!-- WIDE FIGURE: replace placeholder words inside imageSlot with ![Alt text](PUBLIC_IMAGE_URL).
Add imageCover to the figure's class list only to crop the image. No image is loaded by this template. -->
{{figure,imageWide
{{imageSlot [FULL-WIDTH LANDSCAPE IMAGE / PANORAMIC SCENE / MAP]}}
{{caption Figure [#] — [Title / description]. Image: [Artist / source / credit].}}
}}

{{loopGrid
{{loopColumn
### A portrait or tall image
{{figure,imagePortrait
{{imageSlot [PORTRAIT / CHARACTER / MACHINE]}}
{{caption Figure [#] — [Name / credit].}}
}}

[Use this frame when the subject needs vertical space. The default preserves the whole image. Change the frame height in Style Editor if needed.]
}}
{{loopColumn
### An image beside text
{{figure,floatFigure
{{imageSlot [SMALL IMAGE]}}
{{caption [Short caption / credit]}}
}}

[This paragraph wraps beside a small image. Use it for a portrait, a found object, or a detail that supports the text. Keep the caption short. Continue describing the subject until the text clears the frame, then begin a new section. This arrangement is most useful when the image has a simple silhouette and does not need a large reproduction.]

{{clear}}

### Fit or crop
**Default:** the complete image fits inside its frame.

**Cover:** add the **imageCover** class to a figure when you want the frame filled edge to edge. This crops the image; inspect the subject afterward.

{{callout,sideNote
### Image source pattern
Replace only the placeholder words inside **imageSlot** with Markdown image syntax. Use a public, direct image URL. Keep the caption below the frame.

<pre><code>![Description](PUBLIC_IMAGE_URL)</code></pre>
}}
}}
}}

{{footer
{{footerText [YOUR NAME] · UNOFFICIAL TALES FROM THE LOOP MATERIAL}}
{{folio &nbsp;}}
}}

\page

{{rail
{{railLabel CONTINUE}}
{{railNumber &nbsp;}}
{{railCode TFTL}}
{{railVertical TALES FROM THE LOOP / [YOUR CAMPAIGN]}}
}}

{{masthead
{{kicker AN UNOFFICIAL HOMEBREWERY FORMATTING TOOLKIT}}
# [CONTINUED SECTION]
{{dek [A short subtitle or summary for the next sheet.]}}
}}

{{continuation
[Campaign / chapter name] · [Section title] · Continued
}}

{{wideSection
## [Full-width section]
[Use the whole page width for a short introduction, a large table, a handout, or an important overview. Text here is outside the two-column grid. Keep prose brief so lines remain comfortable to read.]
}}

{{splitBand
{{loopColumn
### [Left summary]
[A clue, objective, or key fact.]
}}
{{loopColumn
### [Right summary]
[A consequence, deadline, or parallel fact.]
}}
}}

{{loopGrid
{{loopColumn
## [Section continues]
[Continue your story or reference material here. Copy further paragraphs and headings as needed.]

### [A scene or subtopic]
[Add your text. If this column fills, deliberately move the next section to the second column or another page.]

{{callout,readAloud
### [Narration]
[An optional read-aloud passage.]
}}

### [Next detail]
[Add the next scene, location, clue, or reference entry.]
}}
{{loopColumn
## [Companion section]
[Write related information here. The columns are independent, so you control where each section begins and ends.]

{{statCard
### [Optional reference card]
**Name:** [Name]<br>
**Purpose:** [Function]<br>
**Trouble:** [Action / skill / stakes]
}}

## [End of this section]
[Finish with a consequence, decision, or lead to the next page.]

{{callout,sideNote
### Copy this page
[Delete this box in your finished brew. To add another sheet, copy this page's source from rail to footer and place a page-break command before it. Both page-number displays update automatically.]
}}
}}
}}

{{wideSection
### [Closing reference / full-width handout]
[An optional concluding note, short table, or document that spans both columns.]
}}

{{footer
{{footerText [YOUR NAME] · UNOFFICIAL TALES FROM THE LOOP MATERIAL}}
{{folio &nbsp;}}
}}

\page

{{rail
{{railLabel MYSTERY}}
{{railNumber &nbsp;}}
{{railCode FLOW}}
{{railVertical [CAMPAIGN / MYSTERY / GM REFERENCE]}}
}}

{{masthead
{{kicker AN EDITABLE MYSTERY MAP / GM ONLY}}
# FOLLOW THE CLUES
{{dek Several discoveries can lead the Kids toward the same confrontation.<br>Replace every bracketed field with your own locations and evidence.}}
}}

{{clueFlow
{{flowStart
### [The opening disturbance]
{{nodeDetail [Why the Kids investigate. Offer access to all three clue sites.]}}
}}
{{flowArrow ↓}}
{{flowArrow ↓}}
{{flowArrow ↓}}
{{clueNode
### 01 / [Clue site]
{{nodeDetail [Evidence pointing toward the showdown.]}}
}}
{{clueNode
### 02 / [Clue site]
{{nodeDetail [Another way to learn where to go.]}}
}}
{{clueNode
### 03 / [Clue site]
{{nodeDetail [A person or object that reveals the destination.]}}
}}
{{flowArrow ↓}}
{{flowArrow ↓}}
{{flowArrow ↓}}
{{flowEnd
### [The showdown / discovery]
{{nodeDetail [The central dilemma. What can the Kids change?]}}
}}
}}

{{loopGrid
{{loopColumn
## Make the routes meaningful
[Give each location its own atmosphere, evidence, and relationship. Any one route can reveal the destination; other routes add context or useful options.]

**Cross-link:** [At site 01, evidence also points to site 02. At site 03, someone remembers site 01.]

**If a clue is missed:** [A second source, event, or witness keeps the mystery moving.]

{{callout
### Keep the graph readable
Use short labels in the nodes. Put details in the reference table. These are editable text containers, not a flattened image.
}}
}}
{{loopColumn
## Pressure and consequences
{{timeline
**[First beat]** / [Everyday life calls the Kids away.]

**[Second beat]** / [The situation changes at a clue site.]

**[Deadline]** / [What happens if nobody intervenes.]
}}

{{npcQuote
[“A short quote that captures the person at the heart of the mystery.”]
}}

**Afterward:** [An ordinary-life scene showing what the Kids gained, lost, or understood.]
}}
}}

{{wideSection
## Clue reference
| Site | Essential discovery | Extra help or complication |
|:---|:---|:---|
| 01 / [Name] | [Where the trail leads] | [What this route adds] |
| 02 / [Name] | [Where the trail leads] | [What this route adds] |
| 03 / [Name] | [Where the trail leads] | [What this route adds] |
}}

{{footer
{{footerText [YOUR NAME] · ORIGINAL UNOFFICIAL TALES FROM THE LOOP MATERIAL}}
{{folio &nbsp;}}
}}


\page

{{coverPage
{{coverEyebrow [AN ORIGINAL MYSTERY / YOUR CAMPAIGN]}}
# [YOUR TITLE]<br>[SECOND LINE]
{{coverSubtitle [A subtitle / place / year]}}

{{coverArt
[YOUR COVER IMAGE]<br>Replace this text with a public image URL.
}}

{{coverPreamble
[An ordinary day, one impossible detail, and a reason the Kids cannot walk away. Write a short, evocative introduction here.]
}}

{{coverAuthor BY [YOUR NAME]}}

{{coverLegal
[Your copyright and image credits.]<br>
Unofficial material for Tales from the Loop.<br>
[If publishing through Free League Workshop, supply the required notice and permitted Workshop branding under that agreement.]
}}
}}

<!-- TITLE PAGE: copy this complete page to the front. Keep the page break after it.
Replace the coverArt contents with ![Description](PUBLIC_IMAGE_URL).
This cover intentionally has no chapter rail or printed folio.
All other pages retain automatic numbering; after moving this cover first, numbering includes the cover.
No official logos or artwork are supplied. -->

\page

{{rail
{{railLabel TOOLKIT}}
{{railNumber &nbsp;}}
{{railCode LOGOS}}
{{railVertical ORIGINAL FICTIONAL ORGANIZATIONS / SETTING PROPS}}
}}

{{masthead
{{kicker ORIGINAL SVG ASSETS / AN ALTERNATIVE 1980S}}
# ORGANIZATIONS
{{dek Eight fictional identities for letters, equipment labels,<br>school paperwork, terminals, and suspicious deliveries.}}
}}

{{logoGrid
{{logoCard
![NORDHAMN ENERGI](https://udeudeude.github.io/tales-from-the-loop/assets/nordhamn-energi.svg)
A municipal power utility; substations, meters, maintenance notices.
{{logoCode default / Nordhamn}}
}}
{{logoCard
![VEKTORA COMPUTING SYSTEMS](https://udeudeude.github.io/tales-from-the-loop/assets/vektora-systems.svg)
A computer contractor; terminal rooms, magnetic media, access cards.
{{logoCode brandVektora}}
}}
{{logoCard
![SUNDBY SIGNALVERK](https://udeudeude.github.io/tales-from-the-loop/assets/sundby-signalverk.svg)
A telecommunications supplier; relay towers, service vans, switchboards.
{{logoCode brandSundby}}
}}
{{logoCard
![MERIDIAN LABORATORY SYSTEMS](https://udeudeude.github.io/tales-from-the-loop/assets/meridian-labs.svg)
A scientific-instrument company; lab labels, sample crates, calibration slips.
{{logoCode brandMeridian}}
}}
{{logoCard
![NORTHLINE TRANSIT AUTHORITY](https://udeudeude.github.io/tales-from-the-loop/assets/northline-transit.svg)
A transport authority; bus passes, depots, routes, lost-property receipts.
{{logoCode brandNorthline}}
}}
{{logoCard
![ASTER COLD STORAGE](https://udeudeude.github.io/tales-from-the-loop/assets/aster-cold-storage.svg)
An industrial refrigeration company; warehouses and temperature logs.
{{logoCode brandAster}}
}}
{{logoCard
![BOREAL SURVEY OFFICE](https://udeudeude.github.io/tales-from-the-loop/assets/boreal-survey-office.svg)
A mapping and surveying bureau; restricted maps, field notes, borehole tags.
{{logoCode brandBoreal}}
}}
{{logoCard
![LAKE DISTRICT SCHOOL BOARD](https://udeudeude.github.io/tales-from-the-loop/assets/lake-district-schools.svg)
A school administration; permission slips, report cards, attendance records.
{{logoCode brandSchool}}
}}
}}

{{loopGrid
{{loopColumn
## Use a logo
Copy an image URL above into a caption, letterhead, or equipment label. These are original, fictional props. Keep their names or edit the SVG source to invent your own organization.

## Branded paper boxes
The **handout** and **paperBox** styles use gray stationery, a soft shadow, and Nordhamn Energi by default. Add one of the brand classes above to change the letterhead; **noBrand** removes it.
}}
{{loopColumn
{{paperBox,brandMeridian
### Calibration notice
FILE: [REFERENCE]<br>
UNIT: [IDENTIFIER]<br>
[A short clue disguised as an ordinary instruction.]
}}

{{smallText
The downloadable source includes all SVG files. The worn frames, arrows, rail flecks, and paper texture were independently drawn for this toolkit.
}}
}}
}}

{{footer
{{footerText [YOUR NAME] · ORIGINAL FICTIONAL ORGANIZATIONS}}
{{folio &nbsp;}}
}}
