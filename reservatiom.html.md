---
layout: default
title: 预约使用 Equipment Reservation
permalink: /reservation/
---

<link rel="stylesheet" href="{{ '/assets/css/reservation.css' | relative_url }}">

<div class="reservation-container">
{% include reservation-hero.html %}
 {% include reservation-rules.html rules=page.rules %}
 {% include reservation-system.html %}


</div>
  <script src="{{ '/assets/js/reservation.js' | relative_url }}"></script>
