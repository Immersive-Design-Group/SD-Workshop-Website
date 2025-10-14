---
title: Speedy 400
title_cn: 激光切割机
model: Trotec Speedy 400
type: Laser Cutter
type_cn: 激光切割机
category: Digital Fabrication
room: 1114
thumb: assets/images/Equipments/Laser-cutting-machine/Speed400.png

hero:
  image: assets/images/Equipments/Laser-cutting-machine/Speed400.png
  alt: Laser Cutting Machine overview

# Right-column spec values (any of these are optional)
model: Trotec Speedy 400
power: 60-200W
working_area: 1245 x 710 mm
workpiece_height: 112 mm Max
laser_power: 40-200W
materials: 木板 wood, 禁止使用PVC材料 (prohibited from using PVC materials)
purpose: 切割大幅面材料 Cut large-format materials

# Risk level and requirements
risk_level: Medium
risk_level_cn: 中
risk_color: orange
requirements_cn: 通过《<span class="test-name">实验室安全</span>》及《<span class="test-name">激光切割机使用</span>》测试后可预约使用。
requirements_en: Reservation and use require passing both '<span class="test-name">Laboratory Safety test</span>' and '<span class="test-name">Laser Cutter Operation test</span>'.

process:
  title_en: "Process Guide"
  title_cn: "操作指南"
  arrow: "assets/images/Equipments/Soldering Station/arrow.png"       # arrow image
  steps:
    - title_cn: "开机与系统初始化"
      title_en: "Power On & System Initialization"
      pairs:
        - img: "/assets/images/Equipments/Laser-cutting-machine/laser-cutting1.png"
          cn: "将钥匙插入开关，轻轻旋转至<span class='red-brace'>ON</span>位置，然后松开。机器屏幕和指示灯应亮起,机器将自动进行初始化自检。您将看到X轴和Y轴移动回机械原点（通常位于左后方），Z轴可能会上下移动。自检成功后通常会发出一声<span class='red-brace'>滴</span>的提示音。"
          en: "Insert the key into the switch, gently turn it to the <span class='red-brace'>ON</span> position , then release. The machine screen and indicators should light up.The machine will automatically perform <span class='red-brace'>an initialization self-test</span>. You will see the X and Y axes move to the home position (usually the rear-left corner), and the Z axis may move up and down. A successful self-test is usually indicated by a beep sound."
    
    - title_cn: "准备平台与材料"
      title_en: "Prepare the Bed & Material"
      pairs:
        - img: "/assets/images/Equipments/Laser-cutting-machine/laser-cutting2.png"
          cn_lines:
            - "打开机器上盖"
            - "将材料平整地放入工作区域。使用卡尺精确测量材料厚度"
          en_lines:
            - "Open the top lid of the machine."
            - "Place the material flat into the work area. Use calipers to accurately measure the material thickness."
    
    - title_cn: "定位与聚焦激光头"
      title_en: "Position and Focus the Laser Head"
      pairs:
        - img: "/assets/images/Equipments/Laser-cutting-machine/laser-cutting3.png"
          cn_lines:
            - "使用控制面板上的方向键将激光头移动到所需起始位置，通常是材料的左上角。"
            - "方法A（手动聚焦）：将聚焦工具挂在激光喷嘴下方，缓慢提升Z轴，直到工具自由落下，表示聚焦已设置。"
            - "方法B（自动聚焦）：按下控制面板上的自动聚焦或Z-自动按钮，激光头会自动下降，用传感器探测材料表面，并设置正确的聚焦。"
            - "<span class='red-brace'>至关重要：聚焦时一定确保聚焦点在材料上，否则激光头容易损坏</span>"
          en_lines:
            - "Use the arrow keys on the control panel to move the laser head to the desired starting position, typically the top-left corner of the material."
            - "Method A (Manual Focus): Hang a focus tool under the laser nozzle and slowly raise the Z-axis until the tool falls off freely, indicating the focus is set."
            - "Method B (Auto Focus): Press the 'Auto Focus' or 'Z-Auto' button on the control panel, which causes the laser head to automatically descend, probe the material surface with a sensor, and set the correct focus."
            - "<span class='red-brace'>Critical: Ensure the focal point is on the material during focusing, otherwise the laser head can be easily damaged.</span>"
    
    - title_cn: "软件设置与文件传输"
      title_en: "Software Setup & File Transfer"
      pairs:
        - img: "/assets/images/Equipments/Laser-cutting-machine/laser-cutting4.png"
          cn_lines:
            - "在连接的电脑上，浏览器操作页面打开或导入你的设计文件（PDF、SVG、DXF等）。"
            - "点击适合设计或适合页面按钮，并设置1-2mm的边距。"
            - "<span class='red-brace'>至关重要：在软件中将激光头的当前坐标设置为原点。</span>"
            - "从材料库中选择最接近的材料预设，然后根据你的测试和材料厚度，选择功率、速度和DPI。"
          en_lines:
            - "On the connected computer, the browser interface to open or import your design file (PDF, SVG, DXF, etc.)."
            - "Click the 'Fit to Design' or 'Fit to Page' button and set a 1-2mm margin."
            - "<span class='red-brace'>Critical: In the software, set the current position of the laser head as the origin.</span>"
            - "Select the closest material preset from the library, then choose the Power, Speed, and DPI based on your test and material thickness."
        - img: "/assets/images/Equipments/Laser-cutting-machine/laser-cutting4-2.png"
          cn: "最后点击<span class='red-brace'>发送</span>将任务发送到机器。"
          en: "Finally, click '<span class='red-brace'>Send</span>' to send the job to the machine."
    
    - title_cn: "开始工作与监控"
      title_en: "Start the Job & Supervision"
      pairs:
        - img: "/assets/images/Equipments/Laser-cutting-machine/laser-cutting5.png"
          cn_lines:
            - "首先，打开抽风/除尘电机。"
            - "在机器控制面板上，按下<span class='red-brace'>开始</span>按钮。"
            - "操作员必须全程值守，密切观察激光头出光情况和材料是否有异常。"
          en_lines:
            - "First, turn ON the fume exhaust/extraction system."
            - "On the machine control panel, press the '<span class='red-brace'>Start</span>' button."
            - "The operator must remain present and monitor the entire process, watching the laser beam and material for any abnormalities."

    - title_cn: "完成工作与关机"
      title_en: "Job Completion & Shutdown"
      pairs:
        - img: "/assets/images/Equipments/Laser-cutting-machine/laser-cutting6.png"
          cn_lines:
            - "切割完成后，让抽风机继续运行1-2分钟，以确保所有有害烟雾被彻底排出。"
            - "关闭抽风机。"
            - "打开机盖，小心地取走成品和废料。"
          en_lines:
            - "After cutting is complete, let the exhaust system run for an additional 1-2 minutes to ensure all harmful fumes are completely extracted."
            - "Turn OFF the exhaust system."
            - "Open the lid and carefully remove the finished product and waste material."

safety:
  title_en: "Safety Note"
  title_cn: "安全提示"
  arrow: "assets/images/Equipments/Soldering Station/arrow.png"       # arrow image
  notes:
    - cn: "严禁学生擅自关闭主电源。设备电源的开启与关闭必须由指导老师或在老师授权监督下进行。"
      en: "Students are strictly prohibited from turning the main power on or off unattended. All power operations must be performed by the instructor or under their direct supervision."
    - cn: "切割完成后，切勿立即关闭抽风/除尘系统。必须持续运行，直至设备内部及工作区域的烟雾和尘埃完全排净后再关闭。"
      en: "Do not turn off the exhaust/fume extraction system immediately after cutting is complete. It must continue running until all smoke and dust inside the machine and workspace have been completely evacuated."
    - cn: "激光切割机工作时，操作人员严禁离岗。必须全程密切监视激光头移动与切割过程，以防发生火灾或异常情况。"
      en: "The operator must never leave the laser cutter unattended while it is operating. Continuous monitoring of the laser head movement and cutting process is mandatory to prevent fire or other emergencies."
    - cn: "如设备自检失败，首先检查设备所有舱门和保护盖是否已完全关闭并锁紧。若问题持续，请立即报告老师，切勿自行处理。"
      en: "If the machine's self-test fails, first check that all doors and protective covers are fully closed and secured. If the problem persists, report it to the instructor immediately and do not attempt to fix it yourself."
    - cn: "在设计图纸时，请使用不同颜色(如:红色用于切割，蓝色用于雕刻)来清晰区分切割线和雕刻线，并在软件中正确设置对应参数。"
      en: "When preparing your design files, use distinct colors (e.g., Red for cut, Blue for engrave) to differentiate between cutting and engraving paths, and ensure these are correctly assigned in the software driver."
    - cn: "切割前应优化图形排版，合理安排零件位置以最大化材料利用率，减少浪费。"
      en: "Optimize the layout of your designs before cutting. Arrange parts efficiently to maximize material usage and minimize waste."
    - cn: "在放置材料后、开始切割前，必须重新测量材料的实际厚度，并在软件中校准焦距和功率设置。"
      en: "Always re-measure the actual thickness of your material after placing it on the bed and before starting the job. Calibrate the focus and power settings accordingly in the software."
    - cn: "切割未知材料时，务必先在废料上进行测试。从较低功率和较高速度开始测试，并根据结果逐步调整参数，直至达到最佳效果。"
      en: "Always test unknown materials on a scrap piece first. Begin with lower power and higher speed settings, then gradually adjust parameters based on the test results to achieve the optimal outcome."
    - cn: "切割易燃材料(如纸张、薄木板)时，建议采用多次通过的方式(较高速度、较低功率)，以避免材料过度燃烧。同时必须格外留意观察，防止火灾。"
      en: "For flammable materials (e.g., paper, thin wood), it is advisable to use multiple passes (higher speed, lower power) to prevent excessive burning or ignition. Extra vigilance is required to prevent fire."
    - cn: "如发生火灾、冒烟等紧急情况，立即按下紧急停止按钮，并迅速报告老师。熟知灭火器及消防设备的位置和使用方法。"
      en: "In case of an emergency (fire, smoke), press the emergency stop button immediately and report to the instructor promptly. Be familiar with the location and operation of fire extinguishers and safety equipment."


---

