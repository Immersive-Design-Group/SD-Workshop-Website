---
title: BambuLab X1E
title_cn: 3D打印机
type: 3D Printer
type_cn: 3D打印机
category: Digital Fabrication
room: 1114
thumb: assets/images/Equipments/bambulab X1E.png

hero:
  image: assets/images/Equipments/3D-Printer-X1E/3D Printer X1E.png
  alt: 3D Printer X1E

# Right-column spec values (any of these are optional)
model: Bambulab P1S/X1E
print_size: 宽256mm; 深256mm; 高256mm (Width 256mm; Depth 256mm; Height 256mm)
nozzle_spec: 0.4
material_type: PLA only
purpose: 造型 Modeling

# Risk level and requirements
risk_level: Medium
risk_level_cn: 中
risk_color: orange
requirements_cn: 通过《<span class="test-name">实验室安全</span>》及《<span class="test-name">3D打印机使用</span>》测试后预约使用。
requirements_en: Reservation and use require passing both '<span class="test-name">Laboratory Safety test</span>' and '<span class="test-name">3D Printer Operation test</span>'.

process:
  title_en: "Soldering Process Guide"
  title_cn: "操作指南"
  arrow: "assets/images/Equipments/Soldering Station/arrow.png"       # arrow image
  steps:
    - title_cn: "模型准备"
      title_en: "Tools Preparation"
      pairs:
        - img: "assets/images/Equipments/3D-Printer-X1E/3D-Printer1.png"
          cn: "使用工坊或自有电脑进行切片,预估打印时间,预约可使用的打印机。"
          en: "Use the workshop's or your own laptop to slice the model, estimate the printing time, and reserve an available 3dprinter."
    
    - title_cn: "检查打印机状态"
      title_en: "Check 3d printer Status"
      pairs:
        - img: "assets/images/Equipments/3D-Printer-X1E/3D-Printer2.png"
          cn: "开机,检查打印机喷嘴是否有明显堵塞、打印板调平是否卡顿或报错、温控系统是否报错等。如有以上情况请及时反馈并更换打印机。"
          en: "Turn on the printer and check whether the nozzle is visibly clogged, whether the print bed leveling encounters resistance or errors, and whether the temperature control system reports any errors. If any of the above issues occur, please report them promptly and switch to another printer."
    
    - title_cn: "导入模型"
      title_en: "Import"
      pairs:
        - img: "assets/images/Equipments/3D-Printer-X1E/3D-Printer3.png"
          cn: "将预约的打印机断电,从打印机卡槽中退出SD卡,将模型导入SD卡中,并放回SD卡至打印机后开机。"
          en: "Power off the reserved printer, remove the SD card from the slot, copy the model file to the SD card, reinsert it into the printer, and then power the printer back on."
    
    - title_cn: "装载耗材"
      title_en: "Load Filament"
      pairs:
        - img: "assets/images/Equipments/3D-Printer-X1E/3D-Printer4.png"
          cn: "按照切片时选择的料,将料送进软管,并将料盘悬挂在打印机背面的料盘架上,在打印机面板上选择Feeding-Load装载。如使用AMS则将料盘放置在AMS架上并将料插入料盘前方的料嘴里(AMS检测到料后会自动整理料),并在AMS面板上选择对应的料,点击进料"
          en: "Load the filament selected during slicing into the feeding tube and place the spool onto the filament holder at the back of the printer. On the printer panel, choose Feeding → Load to load the filament. If using AMS, place the spool onto the AMS rack, insert the filament into the inlet at the front of the AMS (the AMS will automatically manage the filament once detected), select the corresponding filament on the AMS panel, and click Load."
    
    - title_cn: "开始打印"
      title_en: "Start Printing"
      pairs:
        - img: "assets/images/Equipments/3D-Printer-X1E/3D-Printer5.png"
          cn: "确认料已正确装载、打印板放置方向正确、表面平整后,选择文件开始打印。<span class='red-brace'>在打印机成功打印前3-5层后方可离开。</span>"
          en: "After confirming that the filament is properly loaded, the build plate is placed in the correct orientation, and the surface is flat, select the file and start printing. <span class='red-brace'>Do not leave until the printer has successfully printed the first 3-5 layers.</span>"

safety:
  title_en: "Safety Note"
  title_cn: "安全提示"
  arrow: "assets/images/Equipments/Soldering Station/arrow.png"       # arrow image
  notes:
    - cn: "保持3d打印机内部清洁,拆掉的废料以及打印板上的废料请及时清理。"
      en: "Keep the 3D printer interior clean, promptly remove waste materials and debris from the print bed."
    - cn: "保持3d打印机周围清洁,换下来的废料芯、拆下来的支撑等请及时清理。"
      en: "Keep the area around the 3D printer clean, promptly remove waste filament cores and removed supports."
    - cn: "确保工作空间通风,避免吸入有害气体。"
      en: "Ensure proper ventilation in the workspace to avoid inhaling harmful fumes."
    - cn: "打印过程中避免用手触摸喷头或平台(防止高温烫伤),如需调整,须先暂停设备。"
      en: "During printing, avoid touching the nozzle or platform with your hands (to prevent high-temperature burns). If adjustments are needed, the equipment must be paused first."
    - cn: "更多信息请见:"
      en: "For more information, please see:"
    - cn: '<a href="https://wiki.bambulab.com/zh/p1" target="_blank">https://wiki.bambulab.com/zh/p1</a>'
    - cn: '<a href="https://wiki.bambulab.com/zh/x1" target="_blank">https://wiki.bambulab.com/zh/x1</a>'

---
