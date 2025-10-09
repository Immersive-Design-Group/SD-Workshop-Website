---
layout: default
title: Equipments
permalink: /equipments/

---

<!-- Hero -->
<section class="equip-hero">
  <h1 class="equip-ghost">Equipment</h1>
  <h2 class="equip-title">设备介绍</h2>
</section>

{% assign items = site.equipment | sort: "title" %}
{% assign cats = site.data.equip-categories %}

{% for cat_name in cats %}
  {% assign cat_key = cat_name[0] %}
  {% assign cat_meta = cat_name[1] %}
  {% assign row_items = items | where: "category", cat_key %}

  <section class="equip-row">
  <!-- BLUE ROOM TILE (first cell of the row) -->
  <div class="equip-roomcard">
    <div class="equip-roomcard-media"
         {% if cat_meta.bg %}style="background-image:url('{{ cat_meta.bg | relative_url }}')" {% endif %}>
      <div class="equip-roomcard-tint"></div>

      <div class="equip-room-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 22s7-5.33 7-12A7 7 0 0 0 5 10c0 6.67 7 12 7 12Z" stroke="#fff" stroke-width="2" fill="none"/>
          <circle cx="12" cy="10" r="2.8" fill="#fff"/>
        </svg>
        <span>{{ cat_meta.room }}</span>
      </div>

      <div class="equip-roomcard-text">
        <div class="equip-roomcard-cn">{{ cat_meta.cn }}</div>
        <div class="equip-roomcard-en">{{ cat_key }}</div>
      </div>
    </div>
  </div>

  <!-- EQUIPMENT CARDS (numbered 1,2,3,...) -->
{% assign idx = 0 %}
{% for it in row_items %}
  {% assign idx = idx | plus: 1 %}
  <a class="equip-card equip-card--numbered" href="{{ it.url | relative_url }}">
    <div class="equip-media">
      <img src="{{ it.thumb | relative_url }}" alt="{{ it.title | escape }}">
      <span class="equip-number">{{ idx }}</span>
    </div>
    <div class="equip-meta">
      <h4 class="equip-name">{{ it.title }}</h4>
      <p class="equip-sub">
        {% if it.type_cn %}{{ it.type_cn }}{% if it.type %} · {% endif %}{% endif %}
        {{ it.type }}
      </p>
      {% if it.model %}
      {% endif %}
    </div>
  </a>
{% endfor %}
</section>

{% endfor %}

{% if items == empty %}
  <p style="padding:1rem 5%;color:#666">No equipment added yet. Put files in <code>_equipment/</code>.</p>
{% endif %}
