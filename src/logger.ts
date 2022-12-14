import logUpdate from 'log-update';
import ProgressBar from 'progress';

let progress: ProgressBar;

export const logResolver = (name: string) => {
  logUpdate(`[1/2] Resolving: ${name}`);
};

export const prepareInstall = (count: number) => {
  logUpdate('[1/2] Finished resolving.');
  progress = new ProgressBar('[2/2] Installing [:bar]', {
    complete: '#',
    total: count,
  });
};

export const tickInstalling = () => {
  progress.tick();
};
