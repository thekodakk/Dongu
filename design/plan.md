# Döngü Implementation Plan

> **For agentic workers:** Implement task by task. Delegate independent engine work with exclusive ownership. Verify integrated app.

**Goal:** Premium Türkçe, API anahtarsız çalışan yaşam organizasyonu uygulaması.
**Architecture:** React/Vite UI; saf kurallı engine; versiyonlu localStorage; bağımsız yerel launcher.
**Tech Stack:** React, Vite, Lucide, Node test runner.
**Spec:** spec.md and concept.png.

## Global Constraints
API anahtarı yok. Veriler yerel. Desktop/Dongu hedefi. Gerçek işlevli tüm kontroller. Türkçe, responsive, erişilebilir odak ve klavye.

## Review Focus
Boş envanter; yetersiz süre; bozuk yedek; tekrar tamamlanan öneri; depolama hatası.

## Tasks
- [x] Engine: src/engine.js + src/engine.test.js. Tests önce; rota süreleri, tekrar tamamlanma, import ve plan sınırları.
- [x] UI: App.jsx composition, components.jsx shared primitives, Dashboard.jsx, Inventory.jsx, Planning.jsx, Insights.jsx, Settings.jsx. CRUD, filtre, zaman bütçesi, yedekleme ve açıklama.
- [x] Persistence: state.js, validation and error reporting; storage schema version 1.
- [x] Delivery: local production server launcher, README, Windows shortcut.
- [x] Verification: node tests, build, IAB desktop/mobile, CRUD/persistence/route/plan/backup; concept and screenshot view_image comparison.
