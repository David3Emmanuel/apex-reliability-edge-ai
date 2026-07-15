%% Vertical Roller Mill Gearbox Condition Monitoring & Signal Processing Simulation
% This script simulates high-frequency vibration and acoustic emission (AE) telemetry 
% for a Loesche VRM gearbox (e.g. LM 69.6 at Dangote Cement Ibese) and calculates
% the Equipment Health Index (EHI). It models a bearing defect initiating on Day 15.

%% 1. Define Parameters and Baseline Levels
clear; clc;
duration_days = 30;
fs_vib = 5000; % Vibration sampling rate in Hz
fs_ae = 100000; % Acoustic Emission sampling rate in Hz

% Healthy baseline parameters
base_vib_rms = 1.8; % mm/s (Healthy baseline)
base_ae_energy = 30; % dB (Acoustic emission baseline)
base_temp = 65.0; % Celsius (Base oil temp)

% Initialize arrays for history logging
days = 1:duration_days;
regimes = cell(1, duration_days);
vib_rms_history = zeros(1, duration_days);
ae_energy_history = zeros(1, duration_days);
temp_history = zeros(1, duration_days);
ehi_history = zeros(1, duration_days);
class_label_history = cell(1, duration_days);
confidence_history = zeros(1, duration_days);

rng(42); % Set random seed for reproducibility

%% 2. 30-Day Condition Telemetry Loop
for day = 1:duration_days
    if day <= 15
        regimes{day} = 'HEALTHY';
        vib_rms = base_vib_rms + randn() * 0.05;
        ae_energy = base_ae_energy + randn() * 0.8;
        temp = base_temp + randn() * 0.4;
    elseif day <= 25
        regimes{day} = 'FAULT_INCIPIENT';
        severity = (day - 15) / 10.0;
        ae_energy = base_ae_energy + severity * 45 + randn() * 1.5;
        vib_rms = base_vib_rms + severity * 1.5 + randn() * 0.1;
        temp = base_temp + severity * 8.0 + randn() * 0.6;
    else
        regimes{day} = 'FAULT_SEVERE';
        severity = (day - 25) / 5.0;
        ae_energy = 75 + severity * 45 + randn() * 3.0;
        vib_rms = 3.3 + severity * 4.2 + randn() * 0.25;
        temp = 73.0 + severity * 14.0 + randn() * 0.8;
    end
    
    % Add dynamic load fluctuations (grinding raw material fluctuations)
    process_load = sin(day / 2.0) * 0.1;
    vib_rms = vib_rms + process_load;
    
    % 3. Equipment Health Index (EHI) Calculations
    % Vibration Penalty (ISO 10816-3 thresholds: Alert >2.8, Critical >4.5)
    vib_penalty = 0;
    if vib_rms > 2.8
        vib_penalty = (vib_rms - 2.8) * 6.0;
    end
    if vib_rms > 4.5
        vib_penalty = 10.2 + (vib_rms - 4.5) * 12.0;
    end
    
    % Acoustic Emission Penalty (Alert >50 dB, Critical >80 dB)
    ae_penalty = 0;
    if ae_energy > 50
        ae_penalty = (ae_energy - 50) * 0.4;
    end
    if ae_energy > 80
        ae_penalty = 12.0 + (ae_energy - 80) * 0.8;
    end
    
    % Temperature Penalty (Alert >72C, Critical >80C)
    temp_penalty = 0;
    if temp > 72
        temp_penalty = (temp - 72) * 0.8;
    end
    if temp > 80
        temp_penalty = 6.4 + (temp - 80) * 1.5;
    end
    
    total_penalty = vib_penalty + ae_penalty + temp_penalty;
    ehi = max(0, min(100, round(100 - total_penalty)));
    
    % AI classification emulation
    if strcmp(regimes{day}, 'HEALTHY')
        class_label_history{day} = 'NORMAL_BASELINE';
        conf = 98.5 + randn() * 0.5;
    elseif strcmp(regimes{day}, 'FAULT_INCIPIENT')
        class_label_history{day} = 'INCIPIENT_BEARING_SPALL';
        conf = 70.0 + (day - 15) * 2.5 + randn() * 1.2;
    else
        class_label_history{day} = 'SEVERE_BEARING_DEFECTION';
        conf = 92.5 + (day - 25) * 0.8 + randn() * 0.4;
    end
    
    conf = max(0.0, min(99.9, conf));
    
    % Log values
    vib_rms_history(day) = vib_rms;
    ae_energy_history(day) = ae_energy;
    temp_history(day) = temp;
    ehi_history(day) = ehi;
    confidence_history(day) = conf;
end

%% 4. Format Results and Print Preview
t = table(days', regimes', round(vib_rms_history, 2)', round(ae_energy_history)', round(temp_history, 1)', ehi_history', class_label_history', round(confidence_history, 1)', ...
    'VariableNames', {'Day', 'Regime', 'Vibration_RMS', 'Acoustic_Emission_dB', 'Temp_C', 'EHI', 'Classification', 'Confidence'});

disp('================================================================================');
disp('   MATLAB SIMULATION TELEMETRY PREVIEW (Selected Days)');
disp('================================================================================');
preview_indices = [1, 8, 15, 19, 23, 26, 28, 30];
disp(t(preview_indices, :));
disp('================================================================================');

%% 5. Plot Results (Vibration, AE, and EHI Trend)
figure('Position', [100, 100, 800, 600]);

subplot(3, 1, 1);
plot(days, ehi_history, '-o', 'Color', [0.4, 0.1, 0.7], 'LineWidth', 2);
grid on;
title('Equipment Health Index (EHI) over 30 Days');
xlabel('Time (Days)');
ylabel('EHI (0-100)');
ylim([0, 105]);

subplot(3, 1, 2);
yyaxis left;
plot(days, ae_energy_history, '-s', 'LineWidth', 1.5);
ylabel('Acoustic Emission Level (dB)');
yyaxis right;
plot(days, vib_rms_history, '-^', 'LineWidth', 1.5);
ylabel('Vibration Velocity RMS (mm/s)');
grid on;
title('Vibration and Acoustic Emission Progression');
xlabel('Time (Days)');
legend('Acoustic Emission', 'Vibration', 'Location', 'NorthWest');

subplot(3, 1, 3);
plot(days, temp_history, '-d', 'Color', [0.85, 0.33, 0.1], 'LineWidth', 1.5);
grid on;
title('Gearbox Oil Temperature Trend');
xlabel('Time (Days)');
ylabel('Temperature (Celsius)');
