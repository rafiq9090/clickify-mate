function applyColor(cv, final, config) {
    let result = new cv.Mat();
    let lab = new cv.Mat();
    cv.cvtColor(final, lab, cv.COLOR_RGBA2RGB);
    cv.cvtColor(lab, lab, cv.COLOR_RGB2Lab);
    
    let channels = new cv.MatVector();
    cv.split(lab, channels);
    let L = channels.get(0);
    let A = channels.get(1);
    let B = channels.get(2);
    
    // Aggressive illumination normalization (Pure Scanned Feel)
    let L_bg = new cv.Mat();
    cv.GaussianBlur(L, L_bg, new cv.Size(85, 85), 0); // Wider window for smoother background
    cv.divide(L, L_bg, L, 255, -1);
    
    // Saturation Boost (Vibrant)
    A.convertTo(A, -1, 1.4, (1 - 1.4) * 128);
    B.convertTo(B, -1, 1.4, (1 - 1.4) * 128);
    
    // Global Clarity Boost (CLAHE)
    let clahe = new cv.CLAHE(3.0, new cv.Size(8, 8));
    clahe.apply(L, L);
    clahe.delete();
    
    cv.merge(channels, lab);
    cv.cvtColor(lab, result, cv.COLOR_Lab2RGB);
    cv.cvtColor(result, result, cv.COLOR_RGB2RGBA);
    
    L.delete(); A.delete(); B.delete(); L_bg.delete(); channels.delete(); lab.delete();
    return result;
}
