import { Unzip, zipSync, strToU8 } from 'fflate';

const zipped = zipSync({
    'data.json': strToU8('world'.repeat(100))
});

const extracted: Record<string, Uint8Array> = {};
let totalSize = 0;

try {
    const unzipper = new Unzip((file) => {
        let size = 0;
        const chunks: Uint8Array[] = [];
        file.ondata = (err, chunk, final) => {
            if (err) throw err;
            size += chunk.length;
            totalSize += chunk.length;
            chunks.push(chunk);
            if (final) {
                const combined = new Uint8Array(size);
                let offset = 0;
                for (const c of chunks) {
                    combined.set(c, offset);
                    offset += c.length;
                }
                extracted[file.name] = combined;
                console.log("Extracted", file.name, size);
            }
        };
        file.start();
    });

    unzipper.push(zipped, true);
    console.log("Keys in extracted:", Object.keys(extracted));
} catch (e) {
    console.log("Caught:", e.message);
}
