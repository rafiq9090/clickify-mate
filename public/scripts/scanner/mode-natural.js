function applyNatural(cv, final, config) {
    let result = new cv.Mat();
    
    // Natural mode should preserve the original document tone but fix lighting slightly
    // We avoid the aggressive high-pass divide that makes things look "scanned"
    let lab = new cv.Mat();
    cv.cvtColor(final, lab, cv.COLOR_RGBA2RGB);
    cv.cvtColor(lab, lab, cv.COLOR_RGB2Lab);
    
    let channels = new cv.MatVector();
    cv.split(lab, channels);
    let L = channels.get(0);
    
    // Subtler contrast enhancement for Natural mode
    let clahe = new cv.CLAHE(1.5, new cv.Size(8, 8));
    clahe.apply(L, L);
    clahe.delete();
    
    cv.merge(channels, lab);
    cv.cvtColor(lab, result, cv.COLOR_Lab2RGB);
    cv.cvtColor(result, result, cv.COLOR_RGB2RGBA);
    
    L.delete(); lab.delete(); channels.delete();
    return result;
}
