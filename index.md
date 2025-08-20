---
layout: default
title: 首页 HOME
---

<section class="hero">
  <div class="hero-text">
    <h1 class="cn-title">
      创新创意设计学院<br/>
      工坊空间
    </h1>
    <h2 class="en-subtitle">SD's Workshop Space</h2>
    <p class="meta">
      Space hour： Mon-Fri 9:00-22:00<br/>
      Office hour： Mon-Fri 9:00-17:30
    </p>
    <div class="status-indicator" id="workshop-status">
      <!-- <span class="status-text" id="status-text">Loading...</span> -->
    </div>
  </div>

  <div class="hero-image">
  <img src="{{ '/assets/images/workshop.png' | relative_url }}"
       alt="Workshop Space" class="hero-photo">


  <img src="{{ '/assets/images/cube1.png' | relative_url }}"
       alt="" class="hero-cube">
</div>

</section>
<!-- About -->
<section class="about-wrap">
  <div class="about-inner">
    <div class="about-spacer" aria-hidden="true"></div>

    <div class="about-text">
      <h2 class="about-title">About</h2>

      <p class="about-cn">
        创新创意设计学院工坊空间是一个可供设计学院所有学生使用的协作式原型制作空间。学生通过各种数字化及传统设备来实现他们的创意，
        这些设备包括 3D 打印机、激光切割机、机床、电子零件等。
      </p>

      <p class="about-en">
        Workshop space is a collaborative prototyping space available to all students of Design school.
        We help students to implement their ideas through various digital and conventional devices such as
        3D printers, laser cutters, machine tools, electronic parts and more.
      </p>
    </div>
  </div>
</section>
<section class="space-section">
  <h2 class="section-title">Main Space</h2>

  <div class="space-row">
    <!-- Item 1 -->
    <div class="space-item">
      <div class="space-number">1</div>
      <div class="space-content">
        <h3><strong>数字工作区</strong> Digital Fabrication</h3>
        <p>该工作区位于 1114 室，内部配备有 3D 打印机、激光切割机、焊接台等设备，可满足建模及电路制作等相关需求。</p>
        <p class="en">Workspace is located in Room 1114, equipped with 3D printers, laser cutters, welding stations and other equipment, which can meet the needs of modeling, circuit production and other related tasks.</p>
      </div>
    </div>

    <!-- Item 2 -->
    <div class="space-item">
      <div class="space-number">2</div>
      <div class="space-content">
        <h3><strong>工艺工作区</strong> Manual Fabrication</h3>
        <p>该工作区位于 1111 室，内部配备砂盘机、带锯机、打磨机等设备，可满足五金切割、打磨等相关需求。</p>
        <p class="en">This area is located in Room 1111, equipped with sanding machines, band saws, grinders and other equipment, which can meet the needs of metal cutting, grinding and other related tasks.</p>
      </div>
    </div>
  </div>
</section>
<section class="howto-section">
  <h2 class="howto-ghost">How to use the workshop</h2>

  <!-- Row 1 -->
  <div class="howto-grid howto-top">
    <!-- Hero card -->
    <a class="howto-card howto-hero" href="#">
      <img src="{{ 'assets/images/Rectangle 12.png' | relative_url }}" alt="Weekday">
      <div class="howto-overlay">
        <h3>Weekday</h3>
        <span class="howto-cta">VIEW MORE <span aria-hidden>→</span></span>
      </div>
    </a>

    <!-- Right image card -->
    <a class="howto-card" href="#">
      <img src="{{ 'assets\images\image 15.png' | relative_url }}" alt="">
    </a>
  </div>

  <!-- Row 2 -->
  <div class="howto-grid howto-bottom">
    <a class="howto-card" href="#">
      <img src="{{ 'assets/images/image 16.png' | relative_url }}" alt="">
    </a>
    <a class="howto-card" href="#">
      <img src="{{ 'assets/images/image 17.png' | relative_url }}" alt="">
    </a>
    <a class="howto-card" href="#">
      <img src="{{ 'assets/images/image 18.png' | relative_url }}" alt="">
    </a>
  </div>
</section>



<section class="ta-section" id="ta-schedule">
  <h2 class="ta-ghost">{{ site.data.ta-schedule.title }}</h2>

  <div class="ta-grid" role="table" aria-label="{{ site.data.ta-schedule.title }}">
    <!-- Header -->
    <div class="ta-cell ta-head time" role="columnheader">Time</div>
    {% for d in site.data.ta-schedule.days %}
      <div class="ta-cell ta-head" role="columnheader">{{ d }}</div>
    {% endfor %}
    <!-- Rows -->
    {% for slot in site.data.ta-schedule.slots %}
      <div class="ta-cell ta-time" role="rowheader">{{ slot.time }}</div>
      {% for d in site.data.ta-schedule.days %}
        {% assign p = slot.people[d] %}
        <div class="ta-cell" data-day="{{ d }}">
          {% if p and p.cn %}
            <div>{{ p.cn }}</div>
          {% endif %}
          {% if p and p.en %}
            <div class="ta-en">{{ p.en }}</div>
          {% endif %}
        </div>
      {% endfor %}
    {% endfor %}
  </div>
</section>

<!-- Team Members Section -->
<section class="team-section" id="team">
  <h2 class="team-ghost">{{ site.data.team.title }}</h2>
  
  <div class="team-container">
    <!-- Organizers Row -->
    <div class="team-row">
      <h3 class="team-row-title">
        <span class="title-text">Organizers</span>
        {% if site.data.team.organizers.group_name %}
          <span class="group-name">{{ site.data.team.organizers.group_name }}</span>
        {% endif %}
      </h3>
      <div class="team-members">
        {% for organizer in site.data.team.organizers.members %}
          <div class="team-member">
            <div class="member-avatar">
              {% if organizer.image and organizer.link %}
                <a href="{{ organizer.link }}" target="_blank" rel="noopener noreferrer" class="member-link">
                  <img src="{{ organizer.image | relative_url }}" alt="{{ organizer.name }}">
                </a>
              {% elsif organizer.image %}
                <img src="{{ organizer.image | relative_url }}" alt="{{ organizer.name }}">
              {% endif %}
            </div>
            <div class="member-info">
              <div class="member-name">{{ organizer.name }}</div>
              {% if organizer.degree %}
                <div class="member-degree">{{ organizer.degree }}</div>
              {% endif %}
            </div>
          </div>
        {% endfor %}
      </div>
    </div>
    
    <!-- Designers Row -->
    <div class="team-row">
      <h3 class="team-row-title">
        <span class="title-text">Designers</span>
        {% if site.data.team.designers.group_name %}
          <span class="group-name">{{ site.data.team.designers.group_name }}</span>
        {% endif %}
      </h3>
      <div class="team-members">
        {% for designer in site.data.team.designers.members %}
          <div class="team-member">
            <div class="member-avatar">
              {% if designer.image and designer.link %}
                <a href="{{ designer.link }}" target="_blank" rel="noopener noreferrer" class="member-link">
                  <img src="{{ designer.image | relative_url }}" alt="{{ designer.name }}">
                </a>
              {% elsif designer.image %}
                <img src="{{ designer.image | relative_url }}" alt="{{ designer.name }}">
              {% endif %}
            </div>
            <div class="member-info">
              <div class="member-name">{{ designer.name }}</div>
              <div class="member-degree">{{ designer.degree }}</div>
            </div>
          </div>
        {% endfor %}
      </div>
    </div>
    
    <!-- Developers Row -->
    <div class="team-row">
      <h3 class="team-row-title">
        <span class="title-text">Developers</span>
        {% if site.data.team.developers.group_name %}
          <span class="group-name">{{ site.data.team.developers.group_name }}</span>
        {% endif %}
      </h3>
      <div class="team-members">
        {% for developer in site.data.team.developers.members %}
          <div class="team-member">
            <div class="member-avatar">
              {% if developer.image and developer.link %}
                <a href="{{ developer.link }}" target="_blank" rel="noopener noreferrer" class="member-link">
                  <img src="{{ developer.image | relative_url }}" alt="{{ developer.name }}">
                </a>
              {% elsif developer.image %}
                <img src="{{ developer.image | relative_url }}" alt="{{ developer.name }}">
              {% endif %}
            </div>
            <div class="member-info">
              <div class="member-name">{{ developer.name }}</div>
              <div class="member-degree">{{ developer.degree }}</div>
            </div>
          </div>
        {% endfor %}
      </div>
    </div>
  </div>
</section>