# 🌱 Smart Irrigation Monitoring System

## 📌 Overview

The **Smart Irrigation Monitoring System** is an IoT-based automated irrigation solution designed to monitor soil moisture and control water supply based on the selected **plant type and soil type**.

The system uses a web dashboard to select the plant and soil condition. Based on this selection, a predefined moisture target is assigned and sent to the **ESP32**. The ESP32 continuously compares the target value with the actual soil moisture measured by the sensor and automatically controls the water pump.

---

## 🎯 Objectives

- Monitor soil moisture in real time.
- Allow users to select plant and soil types through a web interface.
- Set a predefined moisture target based on plant and soil selection.
- Send the selected target value to the ESP32.
- Automatically control the irrigation motor/pump.
- Reduce unnecessary water consumption.
- Store and visualize sensor data for monitoring and analysis.

---

## ⚙️ System Architecture

```text
                    ┌──────────────────────┐
                    │     Web Dashboard    │
                    │                      │
                    │  Select Plant Type   │
                    │  Select Soil Type    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Predefined Target   │
                    │  Moisture Value      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Firebase Realtime DB │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │        ESP32         │
                    │                      │
                    │ Receives Target      │
                    │ Reads Soil Moisture  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Compare Values       │
                    │                      │
                    │ Actual < Target      │
                    │       → Pump ON      │
                    │                      │
                    │ Actual ≥ Target      │
                    │       → Pump OFF     │
                    └──────────────────────┘
