function applyMagicGS(cv, final, config) {
    let result = new cv.Mat();
    let gray = new cv.Mat();
    cv.cvtColor(final, gray, cv.COLOR_RGBA2GRAY);
    
    // 1. ELITE DENOISING (Initial pass)
    let denoised = new cv.Mat();
    cv.medianBlur(gray, denoised, 3); 

    // 2. CYCLOPS GLOBAL NORMALIZATION (The Perfect Shadow Killer)
    // Massive 301x301 window to surgically destroy broad horizontal shadows and lines
    let bg_wide = new cv.Mat();
    cv.GaussianBlur(denoised, bg_wide, new cv.Size(301, 301), 0); 
    let normalized = new cv.Mat();
    cv.divide(denoised, bg_wide, normalized, 255, -1);
    bg_wide.delete();

    // Stage 2: Local paper texture equalization (41x41)
    let bg_local = new cv.Mat();
    let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(41, 41));
    cv.morphologyEx(normalized, bg_local, cv.MORPH_DILATE, kernel); 
    cv.divide(normalized, bg_local, normalized, 255, -1);
    bg_local.delete(); kernel.delete();
    
    // 3. ENTERPRISE-LEVEL TONAL MAPPING (Magic Grayscale Secrets)
    // High-limit CLAHE (5.0) to boost the handwriting texture while keeping it solid
    let clahe = new cv.CLAHE(5.0, new cv.Size(8, 8)); 
    clahe.apply(normalized, normalized);
    clahe.delete();

    // 4. TONAL EXPANSION LUT (Titan Archival S-Curve)
    // Hyper-steep curve specifically tuned for deep professional black handwriting
    let lut = new cv.Mat(1, 256, cv.CV_8U);
    for (let i = 0; i < 256; i++) {
        let val = i / 255.0;
        let k = 18; // Titanic steepness for bold archival look
        let x0 = 0.58; // High threshold for archival purity
        let res = 1.0 / (1.0 + Math.exp(-k * (val - x0)));
        lut.data[i] = Math.min(255, Math.max(0, res * 255.0));
    }
    cv.LUT(normalized, lut, normalized);
    lut.delete();
    
    // 5. SURGICAL BACKGROUND CLAMP (The "Code White" Supreme)
    // Final clamp to ensure paper is 100% spotless from corner to corner
    let mask = new cv.Mat();
    cv.threshold(normalized, mask, 240, 255, cv.THRESH_BINARY);
    normalized.setTo(new cv.Scalar(255), mask);
    mask.delete();
    
    // 6. PREMIUM SMOTHING (Commercial Standard)
    // Professional Gaussian smoothing on final grayscale for smooth ink curves
    cv.GaussianBlur(normalized, normalized, new cv.Size(3, 3), 0.5);
    
    cv.cvtColor(normalized, result, cv.COLOR_GRAY2RGBA);
    
    // Cleanup
    gray.delete(); denoised.delete(); normalized.delete();
    
    return result;
}
