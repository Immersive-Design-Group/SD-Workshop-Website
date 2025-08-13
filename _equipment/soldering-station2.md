---
layout: equipment
title: Soldering Station
title_cn: 焊接台
slug: soldering-station
category: Digital Fabrication
room: 1114
model: FX-888D
type: Electronics
type_cn: 电子设备
thumb: assets/images/Equipments/Soldering Station/soldering-iron.png

hero:
  image: assets/images/Equipments/Soldering Station/soldering-iron.png
  alt: Soldering Station overview

# Right-column spec values (any of these are optional)
model: FX-888D
power: 60W – 100W
temp_range: 200°C – 480°C
purpose: 焊接 Soldering

# Red bullet notes below specs (optional)
spec_notes:
  - 只适用于培训过的学生 · Only for trained members
  - 在助教指导下使用 · Use under the supervision of TA

process:
  title_en: "Soldering Process Guide"
  title_cn: "操作指南"
  arrow: "assets/images/Equipments/Soldering Station/arrow.png"   # arrow image
  steps:
    - title_cn: "工具准备"
      title_en: "Tools Preparation"
      items:
        - img: "assets/images/Equipments/Soldering Station/1.png"
          cn: "电烙铁、焊丝、助焊剂（松香）、铜擦洗垫、吸锡器、架子"
          en: "Soldering iron, solder wire, flux (rosin), copper scrub pad, desoldering pump, clamps."
    - title_cn: "预热"
      title_en: "Preheating"
      items:
        - img: "assets/images/Equipments/Soldering Station/2.png"
          cn: "打开电源并预热焊铁到适当的温度（建议约 350°C/662°F）。"
          en: "Turn on the power and preheat the soldering iron to ~350°C/662°F."
        - img: "/assets/images/steps/soldering/step2b.jpg"
          en: "Keep the iron on its stand while heating."
    - title_cn: "清洁焊接头"
      title_en: "Cleaning the Tip"
      items:
        - img: "assets/images/Equipments/Soldering Station/3.png"
          cn: "使用铜擦洗垫去除焊铁头上的氧化层。"
          en: "Use a copper scrub pad to remove oxidation from the tip."
    - title_cn: "焊接"
      title_en: "Soldering Operation"
      items:
        - img: "assets/images/Equipments/Soldering Station/4.png"
          cn: "用夹具固定组件或放置在耐热焊接垫上。"
          en: "Secure components or place them on a heat-resistant mat."
        - img: "assets/images/Equipments/Soldering Station/4(b).png"
          cn: "把焊铁头触碰焊点，同时送入适量焊丝，形成光滑有光泽的焊点。"
          en: "Touch the joint with the iron and feed solder to form a smooth shiny joint."
    - title_cn: "冷却"
      title_en: "Cooling"
      items:
        - img: "assets/images/Equipments/Soldering Station/5.png"
          cn: "自然冷却或使用风扇加速冷却；使用完毕后请把焊铁放回支架。"
          en: "Let it cool (or fan), and always return the iron to its stand."

safety:
  title_en: "Safety Note"
  title_cn: "安全提示"
  arrow: "assets/images/Equipments/Soldering Station/arrow.png"  # arrow image
  notes:
    - cn: "不用就关掉！！！"
      en: "If you don't need it, just turn it off!!!"
    - cn: "保持焊接工位清洁，周围不要有易燃材料（如纸张、溶剂、塑料）。"
      en: "Keep the soldering area tidy and free of flammable materials like paper, solvents, or plastics."
    - cn: "在给电烙铁上电之前，请检查电源线是否打结或缠绕。如有必要，请拉直电线，以避免火灾隐患。"
      en: "Check the iron’s cord for knots or tangles before plugging it in. Straighten if needed."
    - cn: "在长时间通电的情况下，不要让烙铁闲置。长时间的总通电加速焊咀氧化，缩短其使用寿命。"
      en: "Don’t leave the iron powered on and unused for long—oxidation/wear increases."
    - cn: "使用后，请将烙铁放在其支架上。在离开之前，要反复检查电烙铁是否拔掉插头并完全冷却。"
      en: "After use, return the iron to its stand. Before leaving, confirm it’s unplugged and cooled."
    - cn: "切勿将烙铁头用于通用加热工具（如熔化塑料、燃烧物体）。它是专门为焊接设计的。"
      en: "Never use the tip for anything but soldering. It’s designed for soldering only."
    - cn: "确保工作空间通风，避免吸入有害气体。"
      en: "Ensure proper ventilation to avoid inhaling harmful fumes."

related_tools:
  title_en: "Related Tools"
  title_cn: "相关工具"
  arrow: "assets/images/Equipments/Soldering Station/arrow.png"   # arrow image

  items:
    - key: desoldering_pump
      hero:
        image: "assets/images/Equipments/Soldering Station/Desoldering-1.png"
        overlay_title_cn: "吸锡器"
        overlay_title_en: "Desoldering Pump"
        overlay_desc_cn: "在拆卸和清除带有焊盘的电子元件时，它可以收集熔化的焊料"
        overlay_desc_en: "It collects molten solder when removing electronic components with solder pads."

      steps:
        # Step row 1 — image left, text right
        - side: left
          image: "assets/images/Equipments/Soldering Station/Desoldering-2.png"
          title_cn: "首先，向下按压吸锡器的柱塞，直到卡住。"
          title_en: "First, press down the plunger of the Desoldering Pump until it clicks into place."

        # Step row 2 — text left (two paragraphs), image right
        - side: right
          image: "assets/images/Equipments/Soldering Station/Desoldering-3.png"
          paras_cn:
            - "用电烙铁加热焊点直至焊料熔化。"
            - "取下电烙铁时，迅速将吸锡器的尖端压在焊点上，并按下吸锡器的按钮。"
          paras_en:
            - "Second, heat the solder joints with an electric soldering iron until the solder melts."
            - "While removing the iron, quickly press the tip of the Desoldering Pump onto the solder joints and press the button of the solder sucker."

---
