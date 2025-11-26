let map;
let selectedMarker = null;
let selectedCoords = null;
const defaultLat = 31.0;
const defaultLon = -99.0;
let nrelWindData = null;
const fallbackWindData = {
    'high_wind': { capacityFactor: 0.45, avgWindSpeed: 8.5, description: 'High Wind Region (Great Plains)' },
    'medium_wind': { capacityFactor: 0.35, avgWindSpeed: 7.0, description: 'Medium Wind Region (Midwest)' },
    'low_wind': { capacityFactor: 0.25, avgWindSpeed: 5.5, description: 'Low Wind Region (Southeast)' },
    'coastal': { capacityFactor: 0.40, avgWindSpeed: 8.0, description: 'Coastal Region' }
};
let useAPI = false;
async function loadNRELData() {
    try {
            const response = await fetch('texas_dense_wind_data.json?v=' + Date.now());
        if (response.ok) {
            nrelWindData = await response.json();
            console.log('✓ Loaded Texas Dense wind data from JSON');
            console.log('Data source:', nrelWindData.metadata?.source || 'Texas Dense Wind Resource');
            if (nrelWindData.metadata?.grid_resolution_degrees) {
                console.log('Resolution:', nrelWindData.metadata.grid_resolution_degrees, 'degrees (~' + nrelWindData.metadata.grid_resolution_km + 'km spacing)');
            }
            console.log('✓ Using dense Texas data with', nrelWindData.grid_points?.length || 0, 'grid points');
            if (nrelWindData.metadata?.note) {
                console.log('Note:', nrelWindData.metadata.note);
            }
        } else {
            console.warn('Texas high-res data file not found, will use estimated values');
            nrelWindData = null;
        }
    } catch (error) {
        console.warn('Could not load Texas high-res data file, using fallback estimates:', error);
        nrelWindData = null;
    }
}
function initializeMap() {
    map = L.map('map').setView([defaultLat, defaultLon], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    map.on('click', async function(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        if (selectedMarker) {
            map.removeLayer(selectedMarker);
        }
        selectedMarker = L.marker([lat, lon]).addTo(map)
            .bindPopup(`Selected Location<br>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`)
            .openPopup();
        selectedCoords = { lat, lon };
        const locationInfo = document.getElementById('selected-location');
        const windInfoSpan = document.getElementById('location-wind-info');
        if (locationInfo && windInfoSpan) {
            locationInfo.style.display = 'block';
            windInfoSpan.textContent = 'Loading wind data...';
        }
        const windInfo = await estimateWindRegion(lat, lon);
        const capacitySlider = document.getElementById('capacity-factor');
        const capacityValue = document.getElementById('capacity-factor-value');
        if (capacitySlider && capacityValue) {
            const capacityPercent = Math.round(windInfo.capacityFactor * 100);
            capacitySlider.value = capacityPercent;
            capacityValue.textContent = capacityPercent + '%';
        }
        if (locationInfo && windInfoSpan) {
            const windSpeed = windInfo.avgWindSpeed ? windInfo.avgWindSpeed.toFixed(1) : 'N/A';
            windInfoSpan.textContent = `${windSpeed} m/s • Texas`;
        } else if (locationInfo) {
            const windSpeed = windInfo.avgWindSpeed ? windInfo.avgWindSpeed.toFixed(1) : 'N/A';
            locationInfo.textContent = `${windSpeed} m/s • Texas`;
        }
    });
}
async function estimateWindRegion(lat, lon) {
    if (nrelWindData && nrelWindData.grid_points) {
        let closest = null;
        let minDistance = Infinity;
        for (const point of nrelWindData.grid_points) {
            const distance = Math.sqrt((point.lat - lat)**2 + (point.lon - lon)**2);
            if (distance < minDistance) {
                minDistance = distance;
                closest = point;
            }
        }
        if (closest && minDistance < 0.1) {
            let capacityFactor = closest.capacity_factor / 100.0;
            const distanceKm = Math.round(minDistance * 111);
            if (minDistance < 1.0) {
                console.log(`✓ Using Texas High-Res wind data - Distance: ${distanceKm}km`);
                console.log(`  Wind speed: ${closest.wind_speed_mps} m/s, Capacity factor: ${(capacityFactor * 100).toFixed(1)}%`);
            }
            let wildlifeRisk = 'Medium';
            const distToBrackenCave = Math.sqrt((lat - 29.7)**2 + (lon + 98.3)**2) * 111;
            if (distToBrackenCave < 50) {
                wildlifeRisk = 'High (major bat roosting area)';
            }
            else if (lat >= 30 && lat <= 35 && lon >= -100 && lon <= -97) {
                wildlifeRisk = 'Medium-High (migratory bird corridor)';
            }
            else if (lat >= 26 && lat <= 30 && lon > -95.0) {
                wildlifeRisk = 'Medium-High (coastal bird habitat)';
            }
            else if (lat >= 35 && lat <= 36.5 && lon >= -103 && lon <= -100) {
                wildlifeRisk = 'Medium-High (migratory pathway)';
            }
            else if (lon < -101 || (lat >= 31 && lat <= 35 && lon < -102)) {
                wildlifeRisk = 'Low-Medium (sparse wildlife)';
            }
            return {
                key: 'texas_high_res',
                capacityFactor: capacityFactor,
                avgWindSpeed: closest.wind_speed_mps,
                description: `Texas: ${closest.wind_speed_mps} m/s wind speed - Dense interpolated wind resource data`,
                wildlifeRisk: wildlifeRisk,
                source: 'Texas Dense Wind Resource (NREL Interpolated)',
                distance_km: distanceKm
            };
        } else if (closest) {
            console.log('⚠️  Nearest Texas high-res data point is too far:', (minDistance * 111).toFixed(1), 'km away - using estimated values instead');
        } else {
            console.log('⚠️  No Texas high-res data found for this location - using estimated values');
        }
    }
    if (25.84 <= lat <= 36.50 && -106.65 <= lon <= -93.51) {
        if (lon <= -100.5 || (lat >= 33.5 && lon <= -101.5)) {
            const baseWind = 8.0 + (lat - 32) * 0.25 + (lon + 102) * 0.15;
            const windSpeed = Math.min(10.0, Math.max(7.5, baseWind));
            const capacityFactor = 0.28 + (windSpeed - 7.5) * 0.04;
            let wildlifeRisk = 'Low-Medium (sparse wildlife)';
            if (lat >= 33.5 && lat <= 35 && lon >= -103 && lon <= -101) {
                wildlifeRisk = 'Medium (migratory pathway)';
            }
            return {
                key: 'west_texas',
                capacityFactor: Math.min(0.45, Math.max(0.25, capacityFactor)),
                avgWindSpeed: windSpeed,
                description: `West Texas - Estimated (${windSpeed.toFixed(1)} m/s)`,
                wildlifeRisk: wildlifeRisk,
                source: 'Estimated (based on regional patterns)'
            };
        }
        if (-100.5 < lon && lon <= -97.5) {
            const baseWind = 7.0 + (lat - 30) * 0.12 + (lon + 99) * 0.08;
            const windSpeed = Math.min(8.5, Math.max(6.5, baseWind));
            const capacityFactor = 0.30 + (windSpeed - 6.5) * 0.03;
            let wildlifeRisk = 'Medium';
            const distToBrackenCave = Math.sqrt((lat - 29.7)**2 + (lon + 98.3)**2) * 111;
            if (distToBrackenCave < 50) {
                wildlifeRisk = 'High (major bat roosting area)';
            } else if (lat >= 30 && lat <= 34 && lon >= -99 && lon <= -97) {
                wildlifeRisk = 'Medium-High (migratory bird corridor)';
            }
            return {
                key: 'central_texas',
                capacityFactor: Math.min(0.38, Math.max(0.28, capacityFactor)),
                avgWindSpeed: windSpeed,
                description: `Central Texas - Estimated (${windSpeed.toFixed(1)} m/s)`,
                wildlifeRisk: wildlifeRisk,
                source: 'Estimated (based on regional patterns)'
            };
        }
        if (-97.5 < lon && lon <= -93.51) {
            const baseWind = 6.8 + (lat - 29) * 0.15 + (lon + 96) * 0.05;
            const windSpeed = Math.min(8.0, Math.max(6.5, baseWind));
            const capacityFactor = 0.28 + (windSpeed - 6.5) * 0.04;
            let wildlifeRisk = 'Medium';
            if (lat >= 26 && lat <= 30 && lon > -95.0) {
                wildlifeRisk = 'Medium-High (coastal bird habitat)';
            }
            return {
                key: 'eastern_texas',
                capacityFactor: Math.min(0.38, Math.max(0.26, capacityFactor)),
                avgWindSpeed: windSpeed,
                description: `Eastern Texas - Estimated (${windSpeed.toFixed(1)} m/s)`,
                wildlifeRisk: wildlifeRisk,
                source: 'Estimated'
            };
        }
        if (lat < 31.0) {
            const isCoastal = lon > -97;
            const baseWind = isCoastal ? 6.8 : 6.2;
            const windSpeed = baseWind + (lat - 26) * 0.06 + (lon + 100) * 0.03;
            const capacityFactor = 0.26 + (windSpeed - 6.0) * 0.04;
            let wildlifeRisk = 'Medium';
            if (lon > -95.0) {
                wildlifeRisk = 'Medium-High (coastal bird habitat)';
            }
            return {
                key: 'southern_texas',
                capacityFactor: Math.min(0.36, Math.max(0.24, capacityFactor)),
                avgWindSpeed: Math.min(7.5, Math.max(6.0, windSpeed)),
                description: `Southern Texas - Estimated (${windSpeed.toFixed(1)} m/s)`,
                wildlifeRisk: wildlifeRisk,
                source: 'Estimated (NREL data not available for this region)'
            };
        }
    }
    if (lat >= 35 && lat <= 49 && lon >= -110 && lon <= -95) {
        return {
            key: 'high_wind',
            ...fallbackWindData['high_wind'],
            source: 'Estimated'
        };
    }
    if (lat >= 38 && lat <= 47 && lon >= -95 && lon <= -85) {
        return {
            key: 'medium_wind',
            ...fallbackWindData['medium_wind'],
            source: 'Estimated'
        };
    }
    if ((lon <= -70 || (lon >= -125 && lon <= -110)) && (lat >= 32 && lat <= 50)) {
        return {
            key: 'coastal',
            ...fallbackWindData['coastal'],
            source: 'Estimated'
        };
    }
    return {
        key: 'medium_wind',
        ...fallbackWindData['medium_wind'],
        source: 'Estimated'
    };
}
function formatNumber(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
async function calculateImpacts() {
    if (!selectedCoords) {
        alert('Please select a location on the map first.');
        return;
    }
    const turbineCount = parseInt(document.getElementById('turbine-count').value) || 10;
    const turbineSizeMW = parseFloat(document.getElementById('turbine-size').value) || 2.5;
    const capacityFactor = parseFloat(document.getElementById('capacity-factor').value) / 100 || 0.35;
    const windData = await estimateWindRegion(selectedCoords.lat, selectedCoords.lon);
    let baseCapacityFactor = windData.source.includes('NREL') 
        ? windData.capacityFactor 
        : capacityFactor;
    let sizeAdjustment = 0;
    if (turbineSizeMW > 2.0) {
        if (turbineSizeMW <= 3.0) {
            sizeAdjustment = (turbineSizeMW - 2.0) * 0.01;
        } else if (turbineSizeMW <= 5.0) {
            sizeAdjustment = 0.01 + (turbineSizeMW - 3.0) * 0.007;
        } else {
            sizeAdjustment = 0.023 + (turbineSizeMW - 5.0) * 0.005;
        }
    }
    const effectiveCapacityFactor = Math.min(0.55, baseCapacityFactor + sizeAdjustment);
    const totalCapacityMW = turbineCount * turbineSizeMW;
    const avgPowerMW = totalCapacityMW * effectiveCapacityFactor;
    const hoursPerYear = 8760;
    const annualEnergyMWh = avgPowerMW * hoursPerYear;
    const annualEnergyGWh = annualEnergyMWh / 1000;
    const co2Factor = 0.4;
    const annualCO2Avoided = annualEnergyMWh * 1000 * co2Factor / 1000;
    const carsEquivalent = Math.round(annualCO2Avoided / 4.6);
    const totalLandAcres = totalCapacityMW * 50;
    const turbineFootprintAcres = turbineCount * 1;
    let wildlifeRisk = windData.wildlifeRisk || 'Medium';
    if (!windData.wildlifeRisk) {
        if (windData.key === 'coastal' || (selectedCoords.lat >= 40 && selectedCoords.lat <= 50)) {
            wildlifeRisk = 'Medium-High (migratory pathways)';
        } else if (windData.key === 'low_wind') {
            wildlifeRisk = 'Low-Medium';
        }
    }
    const baseNoiseAt400m = 35;
    const distanceReduction = 12;
    const hemisphereGroundEffect = 6;
    const totalNoiseIncrease = distanceReduction + hemisphereGroundEffect;
    const baseNoise = baseNoiseAt400m + totalNoiseIncrease;
    const noiseLevel = baseNoise + (turbineSizeMW > 3 ? 5 : 0);
    const costPerKW = 1750;
    const installationCost = totalCapacityMW * 1000 * costPerKW;
    const baseTransport = 50000;
    const transportCost = turbineCount * baseTransport;
    const lcoeWind = 30;
    const lcoeSolar = 40;
    const lcoeHydro = 60;
    document.getElementById('annual-energy').textContent = 
        formatNumber(annualEnergyGWh) + ' GWh/year';
    document.getElementById('avg-power').textContent = 
        formatNumber(avgPowerMW) + ' MW (average)';
    document.getElementById('co2-avoided').textContent = 
        formatNumber(annualCO2Avoided) + ' tons CO₂/year';
    document.getElementById('co2-equivalent').textContent = 
        `Taking ${carsEquivalent.toLocaleString()} cars off the road`;
    document.getElementById('land-required').textContent = 
        `${formatNumber(turbineFootprintAcres)} acres (turbines) / ${formatNumber(totalLandAcres)} acres (total project area)`;
    document.getElementById('wildlife-impact').textContent = wildlifeRisk;
    document.getElementById('noise-level').textContent = `${noiseLevel} dB`;
    document.getElementById('installation-cost').textContent = 
        '$' + formatNumber(installationCost);
    const costPerMW = installationCost / totalCapacityMW;
    document.getElementById('cost-per-mw').textContent = 
        '$' + formatNumber(costPerMW / 1000000) + ' million per MW';
    document.getElementById('cost-per-mwh').textContent = 
        '$' + lcoeWind + ' per MWh';
    document.getElementById('transport-cost').textContent = 
        '$' + formatNumber(transportCost);
    const totalInvestment = installationCost + transportCost;
    document.getElementById('total-investment').textContent = 
        '$' + formatNumber(totalInvestment);
    const electricityPricePerMWh = 120;
    const annualRevenue = annualEnergyMWh * electricityPricePerMWh;
    const totalCost = installationCost + transportCost;
    const annualOperatingCost = totalCapacityMW * 1000 * 25;
    const annualNetRevenue = annualRevenue - annualOperatingCost;
    const paybackYears = annualNetRevenue > 0 ? (totalCost / annualNetRevenue) : Infinity;
    if (paybackYears !== Infinity && paybackYears > 0) {
        document.getElementById('payback-period').textContent = 
            paybackYears.toFixed(1) + ' years';
    } else {
        document.getElementById('payback-period').textContent = 
            'Not profitable (revenue < operating costs)';
    }
    generateProsCons(turbineCount, turbineSizeMW, totalCapacityMW, annualEnergyGWh, 
                     annualCO2Avoided, wildlifeRisk, installationCost, windData.key);
    const resultsSection = document.getElementById('results-section') || document.getElementById('results');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}
function createComparisonChart(windLCOE, solarLCOE, hydroLCOE, totalCapacity) {
    const chartContainer = document.getElementById('comparison-chart');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';
    const maxCost = Math.max(windLCOE, solarLCOE, hydroLCOE);
    const windPercent = ((maxCost - windLCOE) / maxCost * 100);
    const solarPercent = ((maxCost - solarLCOE) / maxCost * 100);
    const hydroPercent = ((maxCost - hydroLCOE) / maxCost * 100);
    const data = [
        { label: 'Wind Energy', cost: windLCOE, percent: windPercent, color: 'primary' },
        { label: 'Solar Energy', cost: solarLCOE, percent: solarPercent, color: 'accent' },
        { label: 'Hydroelectric', cost: hydroLCOE, percent: hydroPercent, color: 'secondary' }
    ];
    data.forEach(item => {
        const barWrapper = document.createElement('div');
        barWrapper.style.marginBottom = '1rem';
        const labelRow = document.createElement('div');
        labelRow.style.display = 'flex';
        labelRow.style.justifyContent = 'space-between';
        labelRow.style.alignItems = 'center';
        labelRow.style.marginBottom = '0.5rem';
        const label = document.createElement('span');
        label.style.fontWeight = '500';
        label.style.color = 'hsl(var(--foreground))';
        label.textContent = item.label;
        const cost = document.createElement('span');
        cost.style.fontWeight = '700';
        cost.style.color = `hsl(var(--${item.color}))`;
        cost.textContent = `$${item.cost}`;
        labelRow.appendChild(label);
        labelRow.appendChild(cost);
        const barContainer = document.createElement('div');
        barContainer.style.height = '12px';
        barContainer.style.backgroundColor = 'hsl(var(--muted))';
        barContainer.style.borderRadius = '9999px';
        barContainer.style.overflow = 'hidden';
        const fill = document.createElement('div');
        fill.style.height = '100%';
        fill.style.backgroundColor = `hsl(var(--${item.color}))`;
        fill.style.width = item.percent + '%';
        fill.style.transition = 'width 0.5s ease';
        barContainer.appendChild(fill);
        barWrapper.appendChild(labelRow);
        barWrapper.appendChild(barContainer);
        chartContainer.appendChild(barWrapper);
    });
    const note = document.createElement('p');
    note.style.marginTop = '1rem';
    note.style.fontSize = '0.875rem';
    note.style.color = 'hsl(var(--muted-foreground))';
    note.textContent = 'Lower cost per MWh indicates better economic efficiency. Chart shows relative comparison.';
    chartContainer.appendChild(note);
}
function generateProsCons(count, size, capacity, energy, co2, wildlife, cost, region) {
    const prosList = document.getElementById('pros-list');
    const consList = document.getElementById('cons-list');
    prosList.innerHTML = '';
    consList.innerHTML = '';
    const pros = [
        `Produces ${formatNumber(energy)} GWh of clean energy annually`,
        `Avoids ${formatNumber(co2)} tons of CO₂ emissions per year`,
        `No fuel costs or direct emissions during operation`,
        `Wind is a renewable, inexhaustible resource`,
        `Creates local jobs in construction and maintenance`,
        `Can provide energy security and grid stability`,
        `Long operational lifespan (20-25 years)`,
        `Land between turbines can often be used for agriculture`
    ];
    const cons = [
        `High upfront investment: $${formatNumber(cost)}`,
        `Requires significant land area: ${formatNumber(capacity * 50)} acres`,
        `Wildlife impact risk: ${wildlife}`,
        `Intermittent power generation (depends on wind)`,
        `Visual and noise impacts on local communities`,
        `Birds and bats may be killed by turbine blades`,
        `Requires transmission infrastructure to connect to grid`,
        `Manufacturing and installation have environmental costs`
    ];
    pros.forEach(pro => {
        const li = document.createElement('li');
        li.className = 'flex gap-2';
        li.style.display = 'flex';
        li.style.gap = '0.75rem';
        li.style.fontSize = '1.125rem';
        li.style.lineHeight = '1.6';
        li.style.alignItems = 'flex-start';
        li.innerHTML = `
            <div style="width: 8px; height: 8px; background-color: hsl(var(--secondary)); border-radius: 50%; flex-shrink: 0; margin-top: 8px;"></div>
            <span style="flex: 1;">${pro}</span>
        `;
        prosList.appendChild(li);
    });
    cons.forEach(con => {
        const li = document.createElement('li');
        li.className = 'flex gap-2';
        li.style.display = 'flex';
        li.style.gap = '0.75rem';
        li.style.fontSize = '1.125rem';
        li.style.lineHeight = '1.6';
        li.style.alignItems = 'flex-start';
        li.innerHTML = `
            <div style="width: 8px; height: 8px; background-color: hsl(var(--destructive)); border-radius: 50%; flex-shrink: 0; margin-top: 8px;"></div>
            <span style="flex: 1;">${con}</span>
        `;
        consList.appendChild(li);
    });
}
document.addEventListener('DOMContentLoaded', async function() {
    await loadNRELData();
    initializeMap();
    const capacitySlider = document.getElementById('capacity-factor');
    const capacityValue = document.getElementById('capacity-factor-value');
    capacitySlider.addEventListener('input', function() {
        capacityValue.textContent = this.value + '%';
    });
    document.getElementById('calculate-btn').addEventListener('click', async function() {
        try {
            await calculateImpacts();
        } catch (error) {
            console.error('Error calculating impacts:', error);
            alert('Error calculating impacts. Please check the console for details.');
        }
    });
});