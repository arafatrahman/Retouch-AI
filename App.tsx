import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Icon } from './components/Icon';
import { Slider } from './components/Slider';
import { FILTERS, ADJUSTMENT_OPTIONS } from './constants';
import { editImageWithGemini, detectObjectsInImage } from './services/geminiService';
import type { Filter, AdjustmentValues, AdjustmentId, DetectedObject } from './types';
import { ImageComparator } from './components/ImageComparator';
import { ObjectOverlays } from './components/ObjectOverlays';

type ActiveTab = 'filters' | 'adjust' | 'tools';
type ViewMode = 'slider' | 'original' | 'edited';

const ViewModeButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
}> = ({ onClick, isActive, children }) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none";
    const activeClasses = "bg-blue-600 text-white";
    const inactiveClasses = "text-gray-300 hover:bg-gray-700";
    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {children}
        </button>
    )
}

const App: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{ file: File; base64: string; url: string } | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('filters');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('slider');

    const [isDetecting, setIsDetecting] = useState(false);
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
    const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);

    const imageContainerRef = useRef<HTMLDivElement>(null);

    const initialAdjustmentValues = useMemo(() => 
        ADJUSTMENT_OPTIONS.reduce((acc, opt) => {
            acc[opt.id] = opt.defaultValue;
            return acc;
        }, {} as AdjustmentValues), 
    []);

    const [adjustments, setAdjustments] = useState<AdjustmentValues>(initialAdjustmentValues);

    const resetObjectDetectionState = useCallback(() => {
        setDetectedObjects([]);
        setSelectedObject(null);
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                const url = URL.createObjectURL(file);
                setOriginalImage({ file, base64: base64String, url });
                setEditedImageUrl(url); 
                setError(null);
                setActiveFilter(null);
                setAdjustments(initialAdjustmentValues);
                setViewMode('slider');
                resetObjectDetectionState();
            };
            reader.readAsDataURL(file);
        }
    };

    const runEdit = useCallback(async (prompt: string, filterName?: string, forcePngOutput = false) => {
        if (!originalImage) return;

        setIsLoading(true);
        setError(null);
        if(filterName) setActiveFilter(filterName);

        let finalPrompt = prompt;
        if (selectedObject) {
            const { name, boundingBox: bb } = selectedObject;
            const bboxString = `[${bb.y_min.toFixed(3)}, ${bb.x_min.toFixed(3)}, ${bb.y_max.toFixed(3)}, ${bb.x_max.toFixed(3)}]`;
            finalPrompt = `Focusing ONLY on the ${name} located within the bounding box ${bboxString}, apply the following edit. Do not change any other part of the image. Edit: "${prompt}"`;
        }

        try {
            const editedBase64 = await editImageWithGemini(originalImage.base64, originalImage.file.type, finalPrompt);
            const outputMimeType = forcePngOutput ? 'image/png' : originalImage.file.type;
            const blob = await (await fetch(`data:${outputMimeType};base64,${editedBase64}`)).blob();
            const newUrl = URL.createObjectURL(blob);
            
            if (editedImageUrl && editedImageUrl !== originalImage.url) {
              URL.revokeObjectURL(editedImageUrl);
            }

            setEditedImageUrl(newUrl);
            setViewMode('slider'); // Switch back to slider to see comparison
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, editedImageUrl, selectedObject]);

    const handleFilterClick = (filter: Filter) => {
        runEdit(filter.prompt, filter.name);
    };
    
    const handleAdjustmentChange = (id: AdjustmentId, value: number) => {
        setAdjustments(prev => ({ ...prev, [id]: value }));
    };

    const buildAdjustmentPrompt = () => {
        let prompt = "Apply the following targeted adjustments to the photo. ";
        let changes = 0;

        const { skinSmoothing, skinTone, facialShaping, eyeEnlargement, noseModification, mouthShaping } = adjustments;

        if (skinSmoothing > 0) {
            prompt += `Apply skin smoothing at ${skinSmoothing}% intensity for a clearer complexion. `;
            changes++;
        }
        if (skinTone !== 0) {
            prompt += `Adjust skin tone to be ${Math.abs(skinTone)}% ${skinTone > 0 ? 'warmer' : 'cooler'}. `;
            changes++;
        }
        if (facialShaping > 0) {
            prompt += `Subtly slim the facial shape by ${facialShaping}%. `;
            changes++;
        }
        if (eyeEnlargement > 0) {
            prompt += `Enhance and brighten the eyes, with a subtle enlargement of ${eyeEnlargement}%. `;
            changes++;
        }
        if (noseModification > 0) {
            prompt += `Refine the nose to be slightly narrower by ${noseModification}%. `;
            changes++;
        }
        if (mouthShaping > 0) {
            prompt += `Enhance the lips to appear fuller by ${mouthShaping}%. `;
            changes++;
        }

        if (changes === 0) return "Make no changes to the image.";

        prompt += "Ensure all changes look natural and well-blended.";
        return prompt;
    };

    const handleApplyAdjustments = () => {
        const prompt = buildAdjustmentPrompt();
        setActiveFilter(null);
        runEdit(prompt, 'Custom');
    };

    const handleDetectObjects = async () => {
        if (!originalImage) return;
        setIsDetecting(true);
        setError(null);
        resetObjectDetectionState();

        try {
            const objects = await detectObjectsInImage(originalImage.base64, originalImage.file.type);
            setDetectedObjects(objects);
        } catch (err) {
             setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsDetecting(false);
        }
    };

    const handleRemoveBackground = () => {
        const prompt = "Remove the background of this image, making it transparent. The subject should be perfectly isolated with clean, sharp edges. Return the result as a PNG image with a transparent background.";
        setActiveFilter(null);
        runEdit(prompt, 'Background Removed', true);
    };

    const handleDownload = () => {
        if (!editedImageUrl) return;
        const link = document.createElement('a');
        link.href = editedImageUrl;
        const originalFilename = originalImage?.file.name ?? 'image.png';
        const basename = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
        
        let downloadFilename: string;
        if (activeFilter === 'Background Removed') {
            downloadFilename = `etouched_${basename}.png`;
        } else {
            downloadFilename = `etouched_${originalFilename}`;
        }
    
        link.download = downloadFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetImage = () => {
        if (editedImageUrl && editedImageUrl !== originalImage?.url) {
            URL.revokeObjectURL(editedImageUrl);
        }
        setEditedImageUrl(originalImage?.url || null);
        setActiveFilter(null);
        setAdjustments(initialAdjustmentValues);
        resetObjectDetectionState();
    }

    const ImageUploader: React.FC = () => (
        <div className="w-full mx-auto flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-2xl h-full">
             <div className="text-center">
                <Icon type="upload" className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-white">Upload a photo</h3>
                <p className="mt-1 text-sm text-gray-400">Drag and drop or click to select a file</p>
                <label htmlFor="file-upload" className="relative cursor-pointer mt-6 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500">
                    <span>Select Image</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
            </div>
        </div>
    );
    
    return (
        <div className="flex flex-col h-screen">
            <header className="flex-shrink-0 bg-gray-900/80 backdrop-blur-sm z-10">
                <div className="w-full mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                       <div className="flex-1 flex items-center">
                            <div className="flex items-center space-x-2">
                                <Icon type="sparkles" className="h-7 w-7 text-blue-400" />
                                <h1 className="text-2xl font-bold text-white">etouch</h1>
                            </div>
                       </div>
                       <div className="flex-initial">
                            {originalImage && (
                                <div className="flex items-center space-x-1 bg-gray-800 p-1 rounded-full">
                                    <ViewModeButton isActive={viewMode === 'slider'} onClick={() => setViewMode('slider')}>Slider</ViewModeButton>
                                    <ViewModeButton isActive={viewMode === 'original'} onClick={() => setViewMode('original')}>Original</ViewModeButton>
                                    <ViewModeButton isActive={viewMode === 'edited'} onClick={() => setViewMode('edited')}>Edited</ViewModeButton>
                                </div>
                            )}
                       </div>
                       <div className="flex-1 flex items-center justify-end">
                            {originalImage && (
                                <div className="flex items-center space-x-2">
                                <button onClick={handleDownload} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Download Image">
                                        <Icon type="download" className="h-6 w-6" />
                                </button>
                                <label htmlFor="file-upload-replace" className="relative cursor-pointer p-2 rounded-full hover:bg-gray-700 transition-colors" title="Upload new image">
                                        <Icon type="upload" className="h-6 w-6" />
                                        <input id="file-upload-replace" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                            )}
                       </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden p-4 flex items-center justify-center">
                {!originalImage ? <ImageUploader /> : (
                    <div ref={imageContainerRef} className="relative w-full h-full flex items-center justify-center">
                        {viewMode === 'slider' && (
                           <ImageComparator
                                originalImageUrl={originalImage.url}
                                editedImageUrl={editedImageUrl || originalImage.url}
                           />
                        )}
                        {viewMode === 'original' && (
                            <img
                                src={originalImage.url}
                                alt="Original"
                                className="w-full h-full object-contain pointer-events-none rounded-lg shadow-2xl"
                                draggable={false}
                            />
                        )}
                        {viewMode === 'edited' && (
                            <img
                                src={editedImageUrl || originalImage.url}
                                alt="Edited"
                                className="w-full h-full object-contain pointer-events-none rounded-lg shadow-2xl"
                                draggable={false}
                            />
                        )}

                        {originalImage && detectedObjects.length > 0 && viewMode !== 'original' && (
                            <ObjectOverlays
                                objects={detectedObjects}
                                selectedObject={selectedObject}
                                onSelectObject={setSelectedObject}
                                imageUrl={originalImage.url}
                                imageContainerRef={imageContainerRef}
                            />
                        )}

                        {viewMode !== 'slider' && (
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-md pointer-events-none">
                                {viewMode.toUpperCase()}
                            </div>
                        )}
                        
                        {(isLoading || isDetecting) && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg pointer-events-none">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        )}
                    </div>
                )}
                 {error && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white p-4 rounded-lg shadow-lg flex items-center space-x-3 z-20 w-11/12 max-w-md">
                        <Icon type="error" className="h-6 w-6 flex-shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError(null)} className="font-bold">&times;</button>
                    </div>
                 )}
            </main>

            {originalImage && (
                <footer className="flex-shrink-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 pt-2 pb-4">
                    <div className="w-full">
                         <div className="flex justify-around w-full mb-2">
                             <button onClick={() => setActiveTab('filters')} className={`flex flex-col items-center space-y-1 p-2 w-24 transition-colors rounded-lg ${activeTab === 'filters' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white'}`}>
                                <Icon type="sparkles" className="h-6 w-6" />
                                <span className="text-xs font-medium">Filters</span>
                            </button>
                            <button onClick={() => setActiveTab('adjust')} className={`flex flex-col items-center space-y-1 p-2 w-24 transition-colors rounded-lg ${activeTab === 'adjust' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white'}`}>
                                <Icon type="sliders" className="h-6 w-6" />
                                <span className="text-xs font-medium">Adjust</span>
                            </button>
                            <button onClick={() => setActiveTab('tools')} className={`flex flex-col items-center space-y-1 p-2 w-24 transition-colors rounded-lg ${activeTab === 'tools' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white'}`}>
                                <Icon type="magicWand" className="h-6 w-6" />
                                <span className="text-xs font-medium">Tools</span>
                            </button>
                        </div>
                        
                        {selectedObject && (
                            <div className="px-4 pb-2">
                                <div className="flex items-center justify-between bg-gray-700 text-sm px-3 py-1.5 rounded-lg">
                                    <span className="font-medium text-gray-300">Editing: <span className="font-bold text-white">{selectedObject.name}</span></span>
                                    <button onClick={() => setSelectedObject(null)} className="font-mono text-xl leading-none text-gray-400 hover:text-white">&times;</button>
                                </div>
                            </div>
                         )}

                        {activeTab === 'filters' && (
                           <div className="flex items-center space-x-4 custom-scrollbar overflow-x-auto px-4 pb-2">
                                <button onClick={resetImage} className="flex-shrink-0 flex flex-col items-center justify-center space-y-1 w-20 text-center">
                                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition ${!activeFilter ? 'ring-2 ring-blue-500 bg-gray-600' : 'bg-gray-700'}`}>
                                       <Icon type="undo" className="h-6 w-6"/>
                                    </div>
                                    <span className="text-xs font-medium">Original</span>
                                </button>
                                {FILTERS.map(filter => (
                                    <button key={filter.name} onClick={() => handleFilterClick(filter)} className="flex-shrink-0 flex flex-col items-center justify-center space-y-1 w-20 text-center">
                                        <img src={`https://picsum.photos/seed/${filter.name.replace(/\s/g, '')}/56/56`} alt={filter.name} className={`w-14 h-14 rounded-lg object-cover transition ${activeFilter === filter.name ? 'ring-2 ring-blue-500' : ''}`} />
                                        <span className="text-xs font-medium">{filter.name}</span>
                                    </button>
                                ))}
                           </div>
                        )}

                        {activeTab === 'adjust' && (
                            <div>
                                <div className="grid grid-cols-1 gap-y-3 max-h-[160px] overflow-y-auto px-4">
                                {ADJUSTMENT_OPTIONS.map(opt => (
                                    <Slider
                                        key={opt.id}
                                        {...opt}
                                        value={adjustments[opt.id]}
                                        onChange={e => handleAdjustmentChange(opt.id, parseFloat(e.target.value))}
                                        onReset={() => handleAdjustmentChange(opt.id, opt.defaultValue)}
                                    />
                                ))}
                                </div>
                                <div className="flex justify-center pt-4 px-4">
                                    <button onClick={handleApplyAdjustments} disabled={isLoading} className="w-full max-w-sm px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-semibold rounded-lg transition">
                                        {isLoading ? 'Applying...' : 'Apply Adjustments'}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'tools' && (
                            <div className="py-4 flex justify-center items-center px-4 space-x-4">
                                <button 
                                    onClick={handleRemoveBackground} 
                                    disabled={isLoading || isDetecting} 
                                    className="flex items-center space-x-3 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                                >
                                    <Icon type="magicWand" className="h-6 w-6 text-purple-400"/>
                                    <span>Remove Background</span>
                                </button>
                                <button 
                                    onClick={handleDetectObjects} 
                                    disabled={isLoading || isDetecting} 
                                    className="flex items-center space-x-3 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                                >
                                    <Icon type="objectDetection" className="h-6 w-6 text-yellow-400"/>
                                    <span>{isDetecting ? 'Detecting...' : 'Detect Objects'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </footer>
            )}
        </div>
    );
};

export default App;
