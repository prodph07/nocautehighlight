

interface VideoPlayerProps {
    driveId: string;
    title: string;
}

export function VideoPlayer({ driveId, title }: VideoPlayerProps) {
    // Google Drive Preview URL
    const videoUrl = `https://drive.google.com/file/d/${driveId}/preview`;

    return (
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl aspect-video relative">
            <iframe
                src={videoUrl}
                title={title}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
            ></iframe>
        </div>
    );
}
