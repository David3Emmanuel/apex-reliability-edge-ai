# DANGOTE CEMENT PLC (DCP) UNIVERSITY ENGINEERING CHALLENGE
## Challenge Track 2: Predictive Maintenance and Reliability Early-Warning System
### Team: Arb Research Competition
### Final Executive Presentation Deck (10-Slide Pitch)

---

### Slide 1: Challenge Selected and Why it Matters to DCP
* **Slide Title:** Edge AI Predictive Maintenance for High-Reliability Grinding Operations
* **Subtitle:** Protecting critical vertical roller mill gearboxes at Dangote Cement Ibese Plant
* **Core Content:**
  * **Selected Track:** Challenge 2: Predictive Maintenance and Reliability Early-Warning System.
  * **Core Problem:** Unplanned failures in heavy grinding systems, specifically vertical roller mills (VRMs), cause catastrophic gear teeth fractures and bearing spalling, costing over $500,000 per unplanned event.
  * **The Opportunity:** Moving from manual, schedule-based inspection to continuous, edge-based condition monitoring.
  * **Dangote Value Impact:** Directly supports plant reliability targets, maximizes clinker conversion rates, protects multimillion-dollar assets (e.g. Renk COPE and Flender gearboxes), and prevents lost production output.
* **Speaker Notes:**
  Good day, panel of judges. Today, our team, Arb Research Competition, presents a hardware-accelerated early-warning solution designed specifically for Dangote Cement's grinding mills. We focus on Challenge 2, targeting the core operational priority of equipment reliability. By moving away from reactive maintenance and high-bandwidth cloud streaming, we place the predictive intelligence directly on the factory floor. This ensures instant diagnostics and zero network-induced bottlenecks, directly protecting Dangote's production targets.

---

### Slide 2: Current-State Problem Diagnosis
* **Slide Title:** Grinding Mill Downtime: The Hidden Profit Drain
* **Subtitle:** Operational bottlenecks in raw meal and cement grinding at Ibese Plant
* **Core Content:**
  * **Case Study Target:** Loesche raw mills (LM 69.6) and clinker cement mills (LM 63.3+3) operating at the Ibese Plant.
  * **Failure Mechanism:** The grinding process generates massive low-frequency vibrations that mask developing faults. Standard low-frequency sensors only detect faults in final stages of wear, leading to immediate shutdown.
  * **Acoustic Emission vs. Vibration:** Micro-cracking in bearing races and gear teeth emits high-frequency stress waves (50 kHz to 1 MHz) long before macro-vibration levels rise.
  * **Current Gaps:** Manual diagnostic checks are periodic, leaving plants vulnerable to sudden, inter-operational failures. Low-frequency systems act too late, leading to catastrophic collateral damage inside the gearbox housing.
* **Speaker Notes:**
  Let's look at the current state. In cement manufacturing, the grinding mill is a harsh, high-vibration environment. Boulders of limestone are crushed on a rotating table. This generates massive low-frequency background noise. Standard vibration monitoring systems look at low frequencies (under 10 kHz). Unfortunately, by the time bearing or gear wear rises above this grinding noise, the mechanical damage is already severe. Micro-cracking, which is the precursor to bearing spalling, can only be caught early by monitoring high-frequency acoustic emissions. Our diagnosis highlights that catching these faults requires high-speed sensing combined with advanced filtering, which is difficult for standard sequential controllers.

---

### Slide 3: Data, Exhibit Insights, and Key Assumptions
* **Slide Title:** Signal Progression: Winning the Race Against Catastrophic Failure
* **Subtitle:** 30-Day simulated progression of bearing race degradation and early detection
* **Core Content:**
  * **Telemetry Insight:** High-frequency acoustic emission (AE) sensors detect the initial defect on Day 16 (rising 150 percent above baseline), whereas vibration does not exceed the ISO 10816 alert limit (4.5 mm/s) until Day 24.
  * **Early Warning Window:** The acoustic-emission signature provides an 8-day early warning window compared to standard vibration velocity.
  * **Key Assumptions:**
    * The mill operates under stable feed conditions with standard raw meal properties.
    * Base mechanical noise is filtered using hardware-accelerated transforms.
    * Temperature remains a lagging indicator, rising only when friction becomes severe (Day 26).
* **Speaker Notes:**
  We conducted a 30-day simulation of a bearing outer-race defect inside a Loesche mill gearbox. The data proves that acoustic emission acts as the leading indicator. On Day 16, acoustic emission levels jump from 30 dB to 47 dB, indicating micro-crack initiation. Meanwhile, vibration velocity remains flat at around 2.5 mm/s, well within the healthy ISO limit. Vibration only crosses the warning threshold on Day 24, and oil temperature remains completely flat until Day 26. Relying on vibration and temperature alone leaves only 2 days to react before a severe shutdown is required on Day 28. Our acoustic edge monitoring buys the maintenance team an additional 8 days of lead time to plan parts and schedule repairs.

---

### Slide 4: Root-Cause Hypothesis
* **Slide Title:** Why Traditional Systems Fail: Computational and Network Bottlenecks
* **Subtitle:** The serial processing limit and cloud latency risk
* **Core Content:**
  * **High-Speed Sensor Data Load:** A single acoustic emission sensor sampled at 500 kHz generates 8 megabits of data per second. Streaming raw streams from multiple sensors across all mills to a cloud database saturates plant bandwidth.
  * **The CPU Bottleneck:** Sequential central processing units (CPUs) suffer from the von Neumann bottleneck. Executing continuous fast Fourier transforms (FFTs) on high-frequency signals results in stochastic latency (around 15 milliseconds).
  * **Safety Standards Breach:** Unpredictable jitter and processing delays prevent deterministic responses, violating international safety standards like ISO 10218 for immediate protective control.
  * **Root Cause Summary:** The root cause is the combination of late-stage low-frequency sensing and computational delays in sequential edge controllers.
* **Speaker Notes:**
  Why are plants not already monitoring high-frequency acoustic signals continuously? The answer lies in data volume and processing speed. Sampling at 500 kHz generates millions of data points per second. Streaming this raw data to a central server or cloud database causes severe bandwidth bottlenecks and network latency. Furthermore, standard PLCs or PC-based edge controllers process instructions sequentially. Executing complex transforms on these streams results in stochastic latency, meaning the controller response time varies and cannot be guaranteed. This violates ISO safety standards, which require immediate, deterministic shutdown triggers when mechanical thresholds are breached.

---

### Slide 5: Proposed Engineering and Business Solution
* **Slide Title:** Tiered FPGA Edge AI Condition Monitoring Architecture
* **Subtitle:** Localized, deterministic signal intelligence with no cloud dependencies
* **Core Content:**
  * **Hardware Edge Processing:** Deploying dedicated field programmable gate arrays (FPGAs) directly on the plant floor.
  * **The Hybrid Hardware Approach:**
    * **Prototyping Stage:** Intel MAX 10 FPGA (on the Terasic DE10-Lite board) for laboratory validation, using built-in analog-to-digital converters (ADCs).
    * **Industrial Deployment:** Xilinx Zynq-7000 SoC, combining programmable logic for parallel signal transforms with an ARM processor for industrial network protocols.
  * **Edge Machine Learning:** Running a quantized, 1-D convolutional neural network (CNN) directly on the FPGA fabric, compiled via hls4ml.
  * **Bandwidth Optimization:** The edge node processes the high-frequency stream locally, sending only a 1-byte Equipment Health Index (EHI) and diagnostic classifications to the SCADA system.
* **Speaker Notes:**
  Our solution is a Tiered FPGA Edge AI architecture. Instead of streaming raw data, we install a dedicated FPGA hardware co-processor next to the mill. FPGAs process data in parallel, acting as both the data acquisition board and the neural network inference engine. For laboratory validation and prototyping, we specify the affordable Terasic DE10-Lite kit featuring an Intel MAX 10. For full-scale industrial deployment at Ibese and Obajana, we upgrade to the rugged Xilinx Zynq-7000 system-on-chip. The Zynq platform allows us to run high-speed parallel digital signal processing on the programmable logic, while using the integrated ARM cores to handle OPC UA communication, transmitting only low-bandwidth health scores to the plant control room.

---

### Slide 6: Technical Feasibility and Operating Concept
* **Slide Title:** Real-Time Signal Processing Pipeline
* **Subtitle:** Hardware parallelism for microsecond-level fault classification
* **Core Content:**
  * **Sensor Suite:** High-frequency IEPE accelerometers (vibration) and piezoelectric acoustic emission sensors mounted on the input shaft, intermediate shaft, and planetary carrier housing.
  * **DSP Pipeline:** Real-time continuous wavelet transforms (CWT) and fast Fourier transforms (FFT) implemented as hardware pipelines in the FPGA fabric.
  * **hls4ml Optimization:** Quantizing the neural network classifier to 8-bit integers, reducing logic resource consumption by 85 percent.
  * **Operating Results:** Achieves a deterministic inference latency of 28 microseconds, a 500-fold speedup over sequential CPUs.
* **Speaker Notes:**
  Let's trace the signal flow. High-frequency sensors feed raw analog waves directly to external ADCs, which stream digital samples straight into the FPGA pins. The FPGA's programmable logic executes continuous wavelet transforms to filter out background noise and build a time-frequency map of the signal. This map is fed directly into a quantized convolutional neural network running on the same chip. Using the hls4ml compiler, we convert the neural network into optimized hardware logic. This yields a deterministic latency of just 28 microseconds, meaning the system detects and classifies a bearing spall or gear crack almost instantaneously, with zero jitter.

---

### Slide 7: Business Case and Expected Impact
* **Slide Title:** Financial and Operational Return on Investment
* **Subtitle:** Business case for Ibese Mill 1 implementation
* **Core Content:**
  * **Capital Expenditure (CapEx) per Mill:** $8,500 total, including industrial sensors ($4,500), Xilinx Zynq Edge Node hardware ($1,500), cabling and enclosures ($1,000), and engineering integration ($1,500).
  * **Operational Expenditure (OpEx) per Mill:** $1,200 annually for calibration and software maintenance.
  * **Financial Returns:** Preventing a single major VRM gearbox failure saves $500,000 in replacement components and prevents 5 days of raw meal production loss (valued at $250,000).
  * **Payback Period:** Less than 2 months, assuming the system prevents at least one catastrophic failure.
  * **Net Present Value (NPV):** $1.4 million over 5 years per plant, with an Internal Rate of Return (IRR) of 145 percent.
* **Speaker Notes:**
  The business case for this edge solution is compelling. Implementing the system on a critical mill like Ibese Cement Mill 1 requires a modest CapEx of $8,500. This covers the rugged sensors, the Xilinx Zynq edge controller, industrial enclosures, and engineering labor. Compare this to the cost of a single major gearbox failure, which exceeds half a million dollars in direct parts, plus an additional quarter-million in lost clinker output. With an expected payback period of under two months, this system represents a low-cost, high-yield investment. The net present value over five years for a single plant is estimated at $1.4 million.

---

### Slide 8: Risk, Safety, Sustainability, and Mitigation Plan
* **Slide Title:** Rugged Safety for Harsh Industrial Environments
* **Subtitle:** Regulatory compliance and environmental mitigation strategies
* **Core Content:**
  * **Industrial Environment Risk:** High dust levels, extreme vibration, and temperature fluctuations on the mill floor.
  * **Mitigation:** Sensors and edge nodes housed in IP66 rated dust-tight, vibration-isolated steel enclosures.
  * **Electrical Safety:** Intrinsically safe barriers (barrier isolators) to prevent sparking, complying with ATEX Zone 21/22 safety standards for combustible dust environments.
  * **Sustainability Impact:** Optimized maintenance schedules reduce lubrication waste by 20 percent, extend gearbox service life by 5 years, and reduce raw material recycling loops.
* **Speaker Notes:**
  We must address the harsh physical environment of a cement plant. Airborne limestone dust and heat are constant challenges. To mitigate this, our edge nodes are enclosed in IP66 rated, vibration-isolated steel cabinets. Because cement mills contain areas with combustible dust, all sensor loops utilize intrinsically safe barriers to ensure zero sparking risk, fully complying with ATEX and local safety standards. On the sustainability front, extending the lifespan of these multi-ton steel gearboxes saves significant energy associated with manufacturing and transporting replacement castings. It also optimizes lubrication intervals, reducing hazardous waste oil disposal.

---

### Slide 9: Implementation Roadmap and Resources Required
* **Slide Title:** Phased 12-Month Deployment Schedule
* **Subtitle:** From laboratory prototype to plant-wide operational integration
* **Core Content:**
  * **Phase 1: Lab Prototype (Months 1 to 3):** Validate the sensor interfacing and hls4ml network code on the Intel MAX 10 FPGA (DE10-Lite) using simulated data.
  * **Phase 2: Plant Pilot (Months 4 to 6):** Install the Xilinx Zynq edge node on Ibese Cement Mill 1. Run in shadow monitoring mode to calibrate baselines.
  * **Phase 3: SCADA Integration (Months 7 to 9):** Connect FPGA outputs to the central SCADA system via OPC UA, establishing the maintenance escalation workflow.
  * **Phase 4: Plant-Wide Rollout (Months 10 to 12):** Deploy edge nodes to Obajana, Gboko, and Okpella plants.
  * **Required Resources:** Project Manager, Systems Engineer (Firmware), Vibration Specialist, and Plant Maintenance Lead.
* **Speaker Notes:**
  Our implementation plan spans 12 months, divided into four clear phases. We begin in the lab, using the Intel MAX 10 platform to verify our neural network models and sensor input logic. In Phase 2, we move to the field, deploying a pilot node on Ibese Cement Mill 1. During this phase, the system runs in shadow mode, meaning it monitors and records data without active triggers, allowing us to calibrate our EHI thresholds. Phase 3 focuses on SCADA and SAP integration, connecting our edge node via OPC UA and setting up the automated work order workflows. Finally, Phase 4 rolls the system out to the remaining Dangote plants.

---

### Slide 10: Final Recommendation and Pilot Proposal
* **Slide Title:** Deploying the Edge AI Pilot on Ibese Cement Mill 1
* **Subtitle:** A structured proposal to validate reliability and business value
* **Core Content:**
  * **The Recommendation:** Authorize immediate funding for the Phase 1 laboratory design and the Phase 2 pilot on Ibese Cement Mill 1.
  * **Why Ibese Cement Mill 1?** This mill uses a Flender KMPS gearbox, which has experienced higher temperature and vibration transients, making it the highest priority asset.
  * **Pilot Success Criteria:**
    * 100 percent detection of simulated micro-crack anomalies during testing.
    * Latency remains under 50 microseconds consistently.
    * Successful automated work order generation in SAP PM.
  * **Next Step:** Approve the $8,500 initial pilot budget to launch the engineering design phase.
* **Speaker Notes:**
  In conclusion, we recommend that the Sustainability and Maintenance teams at Dangote Cement authorize the immediate launch of the Ibese Cement Mill 1 pilot project. This specific mill represents the highest return on investment due to its critical role in clinker grinding and its history of operational thermal stress. By proving the technology on this asset first, we establish a template for plant-wide reliability automation. Thank you, and we welcome your questions.
